import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import * as sass from 'sass';
import postcss from 'postcss';
import subsetFont from 'subset-font';
import fontverter from 'fontverter';
import * as hb from 'harfbuzzjs';

const STYLES_DIR = fileURLToPath(new URL('../../package/styles/', import.meta.url));
const NODE_MODULES_DIR = fileURLToPath(new URL('../../node_modules/', import.meta.url));
const FONT_AWESOME_DIR = path.join(NODE_MODULES_DIR, '@fortawesome/fontawesome-free');

// The client app serves campus's fonts (synced to styles/fonts) from here, at /fonts/campus/
const CLIENT_FONTS_DIR = fileURLToPath(new URL('../../client/public/fonts/campus/', import.meta.url));
const CLIENT_FONT_EXTENSIONS = ['.woff2', '.woff'];

// Campus's icons are Font Awesome Free glyphs, referenced by codepoint in the Private Use Area.
// Families and weights match Font Awesome's own CSS; the first is the default (classic) family.
const ICON_FONTS = [
  { family: 'Font Awesome 7 Free', weight: 900, file: 'fa-solid-900.woff2' },
  { family: 'Font Awesome 7 Brands', weight: 400, file: 'fa-brands-400.woff2' }
];
const ICON_CODEPOINT_MIN = 0xe000;
const ICON_CODEPOINT_MAX = 0xf8ff;

// @charset must stay the first statement in a CSS file
const CHARSET_RULE = /^@charset "[^"]+";\s*/;

// Images at or under this size are inlined as data URIs; larger ones keep their relative URL.
const INLINE_IMAGE_MAX_BYTES = 8 * 1024;
const IMAGE_MIME_TYPES = {
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};
// Display names that can't be derived from a color's id.
const COLOR_TITLES = {
  'ucd-blue': 'Aggie Blue',
  'ucd-gold': 'Aggie Gold'
};

const RELATIVE_IMAGE_URL = /url\((["']?)(\.\.\/images\/[^"')]+)\1\)/g;

// Sass dirs that get a css.js module per file, and files in them that are entries or config, not partials.
const LIT_SOURCE_DIRS = ['sass', 'ucdlib-sass'];
const LIT_SKIP_FILES = [
  'sass/style.scss',
  'sass/print.scss',
  'sass/vendor.scss',
  'ucdlib-sass/style-ucdlib.scss',
  'ucdlib-sass/css-properties.scss',
  'ucdlib-sass/colors.scss',
  'ucdlib-sass/_config.scss'
];

/**
 * @description Commands for compiling the package's Sass into CSS and Lit css templates.
 */
class Styles {

  /**
   * @description Runs every style build. Add new builds here as they are created.
   * @param {Object} opts - Command options, passed to each build.
   * @returns {Promise<void>}
   */
  async runAll(opts={}) {
    await this.cssProperties(opts);
    await this.campusCss(opts);
    await this.ucdlibCss(opts);
    await this.colors(opts);
    await this.lit(opts);
    await this.clientFonts(opts);
  }

  /**
   * @description Builds styles/css/css-properties.css from ucdlib-sass/css-properties.scss.
   * Keeps only custom property declarations, so non-variable declarations from campus's _root are dropped.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async cssProperties(opts={}) {
    const root = postcss.parse(this._compile('ucdlib-sass/css-properties.scss'));

    root.walkDecls(decl => {
      if ( !decl.prop.startsWith('--') ) decl.remove();
    });
    this._removeEmptyContainers(root);

    await this._write('css/css-properties.css', root.toString(), {
      command: 'css-properties',
      source: 'ucdlib-sass/css-properties.scss'
    });
  }

  /**
   * @description Builds campus's stylesheets as-is: sass/style.scss to css/style.css, and sass/print.scss to css/print.css.
   * Small images are inlined (see _inlineSmallImages); the styles themselves are unmodified.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async campusCss(opts={}) {
    for ( const name of ['style', 'print'] ) {
      const source = `sass/${name}.scss`;
      const css = await this._inlineSmallImages(this._compile(source));
      await this._write(`css/${name}.css`, css, { command: 'campus-css', source });
    }
  }

  /**
   * @description Builds our stylesheet, ucdlib-sass/style-ucdlib.scss to css/style-ucdlib.css.
   * Small images are inlined (see _inlineSmallImages), and a subset of Font Awesome with just the icons it uses
   * is added at the top (see _iconFont). The icon font is also written on its own, to css/font-awesome-subset.css.
   * Also builds css/fonts.css from ucdlib-sass/fonts.scss: the theme fonts, which style-ucdlib.css leaves out,
   * loaded from the hosted cork-theme app.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async ucdlibCss(opts={}) {
    const source = 'ucdlib-sass/style-ucdlib.scss';
    let css = await this._inlineSmallImages(this._compile(source));
    const iconCss = await this._iconFont(css);

    await this._write('css/font-awesome-subset.css', iconCss, { command: 'ucdlib-css', source });

    const charset = css.match(CHARSET_RULE)?.[0] || '';
    css = charset + iconCss + '\n' + css.slice(charset.length);
    await this._write('css/style-ucdlib.css', css, { command: 'ucdlib-css', source });

    const fontsSource = 'ucdlib-sass/fonts.scss';
    await this._write('css/fonts.css', this._compile(fontsSource), { command: 'ucdlib-css', source: fontsSource });
  }

  /**
   * @description Builds @font-face rules for subsets of Font Awesome Free (one per face in ICON_FONTS) with only the
   * icons the CSS uses, inlined as woff2 data URIs. Icons are found as Private Use Area codepoints, written either as
   * escapes (content: "\\f133") or as the characters themselves (Sass interpolation outputs those). Each icon goes in
   * every face that has it. unicode-range limits each face to its icons, so an app that also loads the full
   * Font Awesome still gets the rest. Also defines --fa-style-family-classic, which campus's .btn--icon expects
   * Font Awesome's CSS to set. Fails if an icon is in no face (e.g. a Pro icon), rather than leaving it blank.
   * @param {String} css - Compiled CSS to find icons in.
   * @returns {Promise<String>} CSS with the license comment, @font-face rules and custom property.
   */
  async _iconFont(css) {
    const codepoints = new Set();
    for ( const [, hex] of css.matchAll(/\\([0-9a-fA-F]{4,6})/g) ) codepoints.add(parseInt(hex, 16));
    for ( const char of css ) codepoints.add(char.codePointAt(0));
    const icons = [...codepoints]
      .filter(cp => cp >= ICON_CODEPOINT_MIN && cp <= ICON_CODEPOINT_MAX)
      .sort((a, b) => a - b);

    const faces = [];
    for ( const face of ICON_FONTS ) {
      const font = await fs.readFile(path.join(FONT_AWESOME_DIR, 'webfonts', face.file));
      const available = new hb.Face(new hb.Blob(await fontverter.convert(font, 'sfnt'))).collectUnicodes();
      const faceIcons = icons.filter(cp => available.includes(cp));
      if ( !faceIcons.length ) continue;
      const subset = await subsetFont(font, String.fromCodePoint(...faceIcons), { targetFormat: 'woff2' });
      faces.push({ ...face, icons: faceIcons, subset });
      console.log(`Subset ${faceIcons.length} ${face.family} icons (${subset.length} bytes)`);
    }

    const missing = icons.filter(cp => !faces.some(face => face.icons.includes(cp)));
    if ( missing.length ) {
      throw new Error(`Icons not in Font Awesome Free: ${missing.map(cp => '\\' + cp.toString(16)).join(', ')}`);
    }

    const { version } = JSON.parse(await fs.readFile(path.join(FONT_AWESOME_DIR, 'package.json'), 'utf-8'));
    const fontFaces = faces.map(face => `@font-face {
  font-family: "${face.family}";
  font-style: normal;
  font-weight: ${face.weight};
  font-display: block;
  src: url("data:font/woff2;base64,${face.subset.toString('base64')}") format("woff2");
  unicode-range: ${this._unicodeRange(face.icons)};
}`);

    return `/* Font Awesome Free ${version} subset, ${icons.length} icons used by the theme - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1) */
${fontFaces.join('\n')}
:root {
  --fa-style-family-classic: "${ICON_FONTS[0].family}";
}`;
  }

  /**
   * @description Formats sorted codepoints as a CSS unicode-range, merging consecutive runs (e.g. U+F00C-F00D).
   * @param {Number[]} codepoints - Sorted codepoints.
   * @returns {String} unicode-range value.
   */
  _unicodeRange(codepoints) {
    const ranges = [];
    for ( const cp of codepoints ) {
      const last = ranges[ranges.length - 1];
      if ( last && cp === last[1] + 1 ) last[1] = cp;
      else ranges.push([cp, cp]);
    }
    const hex = cp => cp.toString(16).toUpperCase();
    return ranges.map(([start, end]) => start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`).join(', ');
  }

  /**
   * @description Builds styles/colors.js, campus's palette as JS (for the docs app, and anything that needs colors in JS),
   * from ucdlib-sass/colors.scss, which emits every color in sass/_variables.scss and each category brand.
   * Keeps the exports of the old @ucd-lib/theme-sass/colors.js, with contrast and brandTextOnWhite added to brands.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async colors(opts={}) {
    const source = 'ucdlib-sass/colors.scss';
    const root = postcss.parse(this._compile(source));

    const vars = {};
    const brands = [];
    root.walkRules(rule => {
      const props = {};
      rule.walkDecls(decl => props[decl.prop.slice(2)] = decl.value);
      if ( rule.selector === ':root' ) Object.assign(vars, props);
      else brands.push({ id: rule.selector.replace(/^\.brand-/, ''), ...props });
    });

    const color = id => {
      if ( !vars[id] ) throw new Error(`Color $${id} not found in sass/_variables.scss`);
      return { id, title: this._colorTitle(id), hex: vars[id] };
    };

    const baseColors = {
      blue: color('ucd-blue'),
      gold: color('ucd-gold'),
      black: color('black'),
      white: color('white')
    };

    // Blue and gold 10 are skipped: campus aliases them to 20, as there is no 10 in the style guide
    const tints = (name, opts={}) => {
      const out = {};
      if ( opts.with100 ) {
        out['100'] = { id: `ucd-${name}-100`, title: this._colorTitle(`ucd-${name}-100`), tint: 100, hex: baseColors[name].hex };
      }
      const tintIds = Object.keys(vars)
        .filter(id => id.startsWith(`ucd-${name}-`) && /^\d+$/.test(id.split('-').pop()))
        .filter(id => !(opts.skip || []).includes(Number(id.split('-').pop())))
        .sort((a, b) => b.split('-').pop() - a.split('-').pop());
      for ( const id of tintIds ) {
        const tint = Number(id.split('-').pop());
        const { title, hex } = color(id);
        out[tint] = { id, title, tint, hex };
      }
      return out;
    };

    const exports = {
      baseColors,
      blueTints: tints('blue', { skip: [10] }),
      goldTints: tints('gold', { skip: [10] }),
      // Campus has no $ucd-black-100; the old colors.js had one
      blackTints: tints('black', { with100: true }),
      categoryBrands: Object.fromEntries(brands.map(brand => [
        brand.id.replace(/-(\w)/g, (m, c) => c.toUpperCase()),
        {
          id: brand.id,
          title: this._colorTitle(brand.id),
          hex: brand.color,
          contrast: brand.contrast,
          brandTextOnWhite: brand['text-on-white'] === 'yes'
        }
      ]))
    };

    // One entry per line, keyed by the original export names, so diffs show exactly which colors changed
    const js = Object.entries(exports).map(([name, entries]) => {
      const lines = Object.entries(entries).map(([key, entry]) => `  ${JSON.stringify(key)}: ${JSON.stringify(entry)}`);
      return `export const ${name} = {\n${lines.join(',\n')}\n};`;
    }).join('\n\n');

    await this._write('colors.js', js, { command: 'colors', source: `${source} (sass/_variables.scss)` });
  }

  /**
   * @description Display name for a color id, e.g. "putah-creek" to "Putah Creek", "ucd-blue-90" to "Blue 90".
   * @param {String} id - Color id, as in the Sass variable name.
   * @returns {String} Title.
   */
  _colorTitle(id) {
    if ( COLOR_TITLES[id] ) return COLOR_TITLES[id];
    return id.replace(/^ucd-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /**
   * @description Copies campus's fonts (styles/fonts, e.g. Ryman Eco) to the client app's public/fonts/campus/,
   * where client/dev/css/fonts.css loads them. Only web font formats are copied, and the destination is cleared
   * first so fonts campus removes don't linger.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async clientFonts(opts={}) {
    await fs.rm(CLIENT_FONTS_DIR, { recursive: true, force: true });
    await fs.mkdir(CLIENT_FONTS_DIR, { recursive: true });

    const fontsDir = path.join(STYLES_DIR, 'fonts');
    for ( const file of (await fs.readdir(fontsDir)).sort() ) {
      if ( !CLIENT_FONT_EXTENSIONS.includes(path.extname(file).toLowerCase()) ) continue;
      await fs.copyFile(path.join(fontsDir, file), path.join(CLIENT_FONTS_DIR, file));
      console.log(`Copied styles/fonts/${file} to client/public/fonts/campus/`);
    }
  }

  /**
   * @description Builds a Lit css.js module in styles/js/ for each Sass file in sass/ and ucdlib-sass/
   * (e.g. sass/4_component/_breadcrumbs.scss to js/4_component/_breadcrumbs.css.js, and
   * ucdlib-sass/_u-aspect.scss to js/ucdlib-sass/_u-aspect.css.js).
   * Each partial is compiled with our variable configuration, and small images are inlined.
   * Entry files are skipped, as are partials with no CSS output (e.g. mixins only). js/ is cleared first,
   * so modules for removed campus partials don't linger.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async lit(opts={}) {
    await fs.rm(path.join(STYLES_DIR, 'js'), { recursive: true, force: true });

    // Every partial compiles campus's tools again, so print each warning once rather than once per partial
    const warned = new Set();
    const logger = {
      warn(message, { span }) {
        const location = span ? `${path.relative(STYLES_DIR, fileURLToPath(span.url))}:${span.start.line + 1}` : '';
        if ( warned.has(message + location) ) return;
        warned.add(message + location);
        console.warn(`Warning: ${message.split('\n')[0]}${location ? `\n    ${location}` : ''}`);
      }
    };

    let count = 0;
    for ( const source of await this._listPartials() ) {
      const css = await this._inlineSmallImages(this._compilePartial(source, { logger }));
      if ( !css.trim() ) continue;

      const dir = path.dirname(source).replace(/^sass(\/|$)/, '');
      const dest = path.join('js', dir, path.basename(source, '.scss') + '.css.js');
      await this._write(dest, this._toLitModule(css), { command: 'lit', source, quiet: true });
      count++;
    }
    console.log(`Wrote ${count} modules to styles/js/`);
  }

  /**
   * @description Lists the Sass files that get a css.js module, sorted, relative to the styles dir.
   * @returns {Promise<String[]>} e.g. ['sass/1_base_html/_forms.scss', 'ucdlib-sass/_u-aspect.scss']
   */
  async _listPartials() {
    const files = [];
    for ( const dir of LIT_SOURCE_DIRS ) {
      for ( const file of await fs.readdir(path.join(STYLES_DIR, dir), { recursive: true }) ) {
        const source = path.join(dir, file);
        if ( file.endsWith('.scss') && !LIT_SKIP_FILES.includes(source) ) files.push(source);
      }
    }
    return files.sort();
  }

  /**
   * @description Wraps compiled CSS in a Lit css module. :root becomes :host, so components get custom properties
   * without the global stylesheet, and backslashes, backticks and ${ are escaped for the template literal.
   * @param {String} css - Compiled CSS.
   * @returns {String} JS module source.
   */
  _toLitModule(css) {
    css = css
      .replace(/:root\b/g, ':host')
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    return `import { css } from 'lit';\n\nexport default css\`\n${css.trim()}\n\`;`;
  }

  /**
   * @description Replaces relative image URLs (../images/...) with base64 data URIs when the image is at most
   * INLINE_IMAGE_MAX_BYTES, so they work wherever the CSS ends up (copied, bundled, or in Lit components).
   * Larger images keep their relative URL. Fails if a referenced image is missing.
   * @param {String} css - Compiled CSS, as written to styles/css/.
   * @returns {Promise<String>} CSS with small images inlined.
   */
  async _inlineSmallImages(css) {
    const cssDir = path.join(STYLES_DIR, 'css');
    const dataUris = {};

    for ( const [, , url] of css.matchAll(RELATIVE_IMAGE_URL) ) {
      if ( url in dataUris ) continue;
      const file = path.resolve(cssDir, url);
      const mime = IMAGE_MIME_TYPES[path.extname(file).toLowerCase()];
      const { size } = await fs.stat(file);
      dataUris[url] = ( mime && size <= INLINE_IMAGE_MAX_BYTES ) ?
        `data:${mime};base64,${(await fs.readFile(file)).toString('base64')}` :
        null;
    }

    return css.replace(RELATIVE_IMAGE_URL, (match, quote, url) => dataUris[url] ? `url("${dataUris[url]}")` : match);
  }

  /**
   * @description Compiles a Sass file, resolving packages (e.g. normalize-scss) from node_modules.
   * Deprecation warnings from node_modules packages are silenced; warnings from campus's Sass are shown.
   * @param {String} source - Path of the Sass file, relative to the styles dir.
   * @returns {String} Compiled CSS.
   */
  _compile(source) {
    const { css } = sass.compile(path.join(STYLES_DIR, source), {
      style: 'expanded',
      loadPaths: [NODE_MODULES_DIR],
      quietDeps: true
    });
    return css;
  }

  /**
   * @description Compiles a single partial with our variable configuration (ucdlib-sass/_config.scss) loaded first,
   * through a wrapper that lives in ucdlib-sass/. Sass shares one _variables module across relative paths,
   * so the configuration applies to the partial as it does in style-ucdlib.scss.
   * @param {String} source - Path of the partial, relative to the styles dir.
   * @param {Object} opts - Compile options.
   * @param {Object} opts.logger - Sass logger, if not the default.
   * @returns {String} Compiled CSS.
   */
  _compilePartial(source, opts={}) {
    const wrapperDir = path.join(STYLES_DIR, 'ucdlib-sass');
    const partial = path.relative(wrapperDir, path.join(STYLES_DIR, source))
      .replace(/\.scss$/, '')
      .replace(/(^|\/)_([^/]+)$/, '$1$2');

    const { css } = sass.compileString(`@use "config";\n@use "${partial}" as partial;\n`, {
      url: pathToFileURL(path.join(wrapperDir, '_lit-wrapper.scss')),
      style: 'expanded',
      loadPaths: [NODE_MODULES_DIR],
      quietDeps: true,
      logger: opts.logger
    });
    return css;
  }

  /**
   * @description Writes compiled CSS (or a css.js module) with an "autogenerated" header comment, and logs the path.
   * @param {String} dest - Path to write, relative to the styles dir.
   * @param {String} css - Compiled CSS.
   * @param {Object} opts - Header details.
   * @param {String} opts.command - The `package-tools styles` command that builds the file.
   * @param {String} opts.source - The Sass file it was built from, relative to the styles dir.
   * @param {Boolean} opts.quiet - Don't log the path (for commands that write many files).
   * @returns {Promise<void>}
   */
  async _write(dest, css, opts={}) {
    const header = `/* Autogenerated by \`package-tools styles ${opts.command}\` from ${opts.source}. Do not edit by hand. */`;
    css = css.trim();

    const charset = css.match(CHARSET_RULE);
    css = charset ?
      charset[0].trim() + '\n' + header + '\n' + css.slice(charset[0].length) :
      header + '\n' + css;

    const destPath = path.join(STYLES_DIR, dest);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, css + '\n');
    if ( !opts.quiet ) console.log(`Wrote styles/${dest}`);
  }

  /**
   * @description Removes rules and at-rules that have no children, innermost first.
   * @param {postcss.Root} root - Parsed stylesheet, modified in place.
   * @returns {void}
   */
  _removeEmptyContainers(root) {
    let removed = true;
    while ( removed ) {
      removed = false;
      root.walk(node => {
        if ( (node.type === 'rule' || node.type === 'atrule') && node.nodes && !node.nodes.length ) {
          node.remove();
          removed = true;
        }
      });
    }
  }

}

export default new Styles();
