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

// How apps import files in the styles dir, via the package's "./*" export
const STYLES_IMPORT_PATH = '@ucd-lib/cork-theme/styles';

// Font folders, in lookup order: ours (Proxima Nova), then campus's (synced). Paths in fonts.scss are relative to these.
const FONT_DIRS = ['ucdlib-fonts', 'fonts'];

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

// Images at or under this size are inlined as data URIs; larger ones are loaded from a host (see _resolveImages).
const INLINE_IMAGE_MAX_BYTES = 8 * 1024;
// Prefix of the custom property for each image in style-ucdlib.css and the css.js modules, e.g. --cork-image-header-bar1
const IMAGE_PROPERTY_PREFIX = '--cork-image-';
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
    await this.imageProperties(opts);
    await this.fontFaces(opts);
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
   * Small images are inlined (see _resolveImages); larger ones keep their relative URL, and the styles are unmodified.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async campusCss(opts={}) {
    for ( const name of ['style', 'print'] ) {
      const source = `sass/${name}.scss`;
      const css = await this._resolveImages(this._compile(source));
      await this._write(`css/${name}.css`, css, { command: 'campus-css', source });
    }
  }

  /**
   * @description Builds our stylesheet, ucdlib-sass/style-ucdlib.scss to css/style-ucdlib.css.
   * Images become custom properties (see _resolveImages), and a subset of Font Awesome with just the icons it uses
   * is added at the top (see _iconFont). The icon font is also written on its own, to css/font-awesome-subset.css.
   * Also builds css/fonts.css from ucdlib-sass/fonts.scss: the theme fonts, which style-ucdlib.css leaves out,
   * loaded from the hosted cork-theme app.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async ucdlibCss(opts={}) {
    const source = 'ucdlib-sass/style-ucdlib.scss';
    let css = await this._resolveImages(this._compile(source), { cssVariables: true });
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
   * @description Builds styles/image-properties.js, listing each image that style-ucdlib.css and the css.js modules
   * load from a host (those too large to inline) with its custom property,
   * e.g. { property: '--cork-image-header-bar1', file: 'header-bar1.webp' }.
   * setImageCssCustomProperties() sets the properties, and copyImages() copies the files (see utils/assets).
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async imageProperties(opts={}) {
    const source = 'ucdlib-sass/style-ucdlib.scss';
    const images = await this._listImages(this._compile(source));
    const entries = Object.values(images)
      .filter(image => !image.dataUri)
      .map(image => ({ property: image.property, file: image.file }))
      .sort((a, b) => a.file.localeCompare(b.file));

    const js = `export default [\n${entries.map(entry => `  ${JSON.stringify(entry)}`).join(',\n')}\n];`;
    await this._write('image-properties.js', js, { command: 'image-properties', source });
  }

  /**
   * @description Builds styles/font-faces.js, the faces in ucdlib-sass/fonts.scss as data for the FontFace API,
   * e.g. { family: 'Proxima-Nova', style: 'normal', weight: '400', display: 'swap', src: [{ path, format }] },
   * with paths relative to the fonts host. setFontFaces() loads them, and copyFonts() copies the files
   * (see utils/assets). Fails if a font file isn't in one of FONT_DIRS.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async fontFaces(opts={}) {
    const source = 'ucdlib-sass/fonts.scss';
    const { css } = sass.compileString('@use "fonts" with ($fonts-url: "");\n', {
      url: pathToFileURL(path.join(STYLES_DIR, 'ucdlib-sass', '_font-faces-wrapper.scss')),
      style: 'expanded',
      loadPaths: [NODE_MODULES_DIR],
      quietDeps: true,
      // ucdlib-css already shows any warnings from fonts.scss
      logger: sass.Logger.silent
    });

    const descriptors = {
      'font-family': 'family',
      'font-style': 'style',
      'font-weight': 'weight',
      'font-stretch': 'stretch',
      'font-display': 'display',
      'unicode-range': 'unicodeRange'
    };
    const faces = [];
    postcss.parse(css).walkAtRules('font-face', rule => {
      const face = {};
      rule.walkDecls(decl => {
        if ( decl.prop === 'src' ) {
          face.src = [...decl.value.matchAll(/url\("?([^")]+)"?\)\s*format\("?([^")]+)"?\)/g)]
            .map(([, url, format]) => ({ path: url.replace(/^\//, ''), format }));
        } else if ( descriptors[decl.prop] ) {
          face[descriptors[decl.prop]] = decl.value.replace(/^["']|["']$/g, '');
        }
      });
      faces.push(face);
    });

    for ( const { path: fontPath } of faces.flatMap(face => face.src) ) {
      const found = await Promise.all(FONT_DIRS.map(dir => fs.access(path.join(STYLES_DIR, dir, fontPath)).then(() => true, () => false)));
      if ( !found.includes(true) ) throw new Error(`Font ${fontPath} (from ${source}) not found in styles/${FONT_DIRS.join(' or styles/')}`);
    }

    const js = `export default [\n${faces.map(face => `  ${JSON.stringify(face)}`).join(',\n')}\n];`;
    await this._write('font-faces.js', js, { command: 'font-faces', source });
  }

  /**
   * @description Builds a Lit css.js module in styles/js/ for each Sass file in sass/ and ucdlib-sass/
   * (e.g. sass/4_component/_breadcrumbs.scss to js/4_component/_breadcrumbs.css.js, and
   * ucdlib-sass/_u-aspect.scss to js/ucdlib-sass/_u-aspect.css.js).
   * Each partial is compiled with our variable configuration, and images become custom properties (see _resolveImages).
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
      const css = await this._resolveImages(this._compilePartial(source, { logger }), { cssVariables: true });
      if ( !css.trim() ) continue;

      const dir = path.dirname(source).replace(/^sass(\/|$)/, '');
      const dest = path.join('js', dir, path.basename(source, '.scss') + '.css.js');
      await this._write(dest, this._toLitModule(css), {
        command: 'lit',
        source,
        importPath: `${STYLES_IMPORT_PATH}/${dest}`,
        quiet: true
      });
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
   * @description Resolves relative image URLs (../images/...), so images work wherever the CSS ends up
   * (copied, bundled, or in Lit components). By default, images at most INLINE_IMAGE_MAX_BYTES become base64
   * data URIs and larger ones keep their relative URL (campus's stylesheets, which sit next to images/).
   * With opts.cssVariables, every image becomes its custom property, e.g. var(--cork-image-header-bar1, none):
   * the fallback is the data URI for small images and none for large ones, so with no host set, a background
   * shorthand keeps its color and just has no image. Fails if a referenced image is missing.
   * @param {String} css - Compiled CSS, as written to styles/css/.
   * @param {Object} opts - Options.
   * @param {Boolean} opts.cssVariables - Replace images with custom properties (style-ucdlib.css and css.js modules).
   * @returns {Promise<String>} CSS with images resolved.
   */
  async _resolveImages(css, opts={}) {
    const images = await this._listImages(css);
    return css.replace(RELATIVE_IMAGE_URL, (match, quote, url) => {
      const { property, dataUri } = images[url];
      const value = dataUri ? `url("${dataUri}")` : null;
      if ( opts.cssVariables ) return `var(${property}, ${value || 'none'})`;
      return value || match;
    });
  }

  /**
   * @description Finds the relative image URLs (../images/...) in compiled CSS.
   * Fails if an image is missing, or if two images would share a custom property (e.g. bar.svg and bar.webp).
   * @param {String} css - Compiled CSS, as written to styles/css/.
   * @returns {Promise<Object>} Keyed by URL: { file, property, dataUri }, where dataUri is null for images
   * larger than INLINE_IMAGE_MAX_BYTES (or of an unknown type).
   */
  async _listImages(css) {
    const cssDir = path.join(STYLES_DIR, 'css');
    const images = {};
    const properties = {};

    for ( const [, , url] of css.matchAll(RELATIVE_IMAGE_URL) ) {
      if ( url in images ) continue;
      const filePath = path.resolve(cssDir, url);
      const file = path.basename(filePath);
      const property = IMAGE_PROPERTY_PREFIX + path.basename(file, path.extname(file));
      if ( properties[property] && properties[property] !== file ) {
        throw new Error(`Images ${properties[property]} and ${file} would both use ${property}`);
      }
      properties[property] = file;

      const mime = IMAGE_MIME_TYPES[path.extname(file).toLowerCase()];
      const { size } = await fs.stat(filePath);
      const dataUri = ( mime && size <= INLINE_IMAGE_MAX_BYTES ) ?
        `data:${mime};base64,${(await fs.readFile(filePath)).toString('base64')}` :
        null;
      images[url] = { file, property, dataUri };
    }
    return images;
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
   * @param {String} opts.importPath - How apps import the file (e.g. '@ucd-lib/cork-theme/styles/js/...'); added to the header if given.
   * @param {Boolean} opts.quiet - Don't log the path (for commands that write many files).
   * @returns {Promise<void>}
   */
  async _write(dest, css, opts={}) {
    const lines = [
      `Autogenerated by \`package-tools styles ${opts.command}\` from ${opts.source}.`,
      'Do not edit by hand.'
    ];
    if ( opts.importPath ) lines.push(`Import with ${opts.importPath}`);
    const header = ['/*', ...lines.map(line => ` * ${line}`), ' */'].join('\n');
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
