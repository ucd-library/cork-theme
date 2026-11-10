import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'comment-parser';

const PACKAGE_DIR = fileURLToPath(new URL('../../package/', import.meta.url));
const ELEMENTS_DIR = path.join(PACKAGE_DIR, 'elements');
const UTILS_DIR = path.join(PACKAGE_DIR, 'utils');
const REFERENCE_DIR = fileURLToPath(new URL('../../../docs/reference/', import.meta.url));

// How apps import the package, via its exports
const IMPORT_PATH = '@ucd-lib/cork-theme';

// Template functions every element binds the same way (standard Lit), so they aren't followed from *.tpl.js
const TPL_EXCLUDED = ['render', 'styles'];

// Tags whose whole text is the content, rather than a name, type and description
const ALIASES = { classdesc: 'description', examples: 'example' };

// Lit and custom element lifecycle callbacks: called by the browser or Lit, not by apps, so left out of Methods
const LIFECYCLE = [
  'connectedCallback', 'disconnectedCallback', 'adoptedCallback', 'attributeChangedCallback',
  'shouldUpdate', 'willUpdate', 'update', 'firstUpdated', 'updated',
  'hostConnected', 'hostDisconnected', 'hostUpdate', 'hostUpdated'
];

// Static methods every element has (custom element registration), so left out of Methods
const STATIC_EXCLUDED = ['define'];

// Words that look like a method declaration on the line after a doc block, but aren't
const NOT_METHODS = ['if', 'for', 'while', 'switch', 'return', 'catch', 'function'];

/**
 * @description Commands for generating documentation from the package source.
 */
class Docs {

  /**
   * @description Runs every docs build. Add new builds here as they are created.
   * @param {Object} opts - Command options, passed to each build.
   * @returns {Promise<void>}
   */
  async runAll(opts={}) {
    await this.jsdoc([], opts);
  }

  /**
   * @description Builds markdown reference pages from the JSDoc in package/elements and package/utils, into docs/reference.
   * One page per element, and one per util folder. Only the public API is documented: members starting with _, blocks tagged @private,
   * lifecycle callbacks (see LIFECYCLE), static define() (see STATIC_EXCLUDED), and top-level functions that aren't exported are left out. The index, docs/reference/readme.md, is always rebuilt from every source.
   * @param {String[]} names - Pages to build: element names (e.g. 'cork-header') or util folders (e.g. 'controllers'). Empty builds all,
   * and first clears the old pages.
   * @param {Object} opts - Command options (none yet).
   * @returns {Promise<void>}
   */
  async jsdoc(names=[], opts={}) {
    const pages = await this._listPages();
    const unknown = names.filter(name => !pages.some(page => page.name === name));
    if ( unknown.length ) {
      console.error(`Unknown: ${unknown.join(', ')}. Valid names:\n  ${pages.map(page => page.name).join('\n  ')}`);
      process.exitCode = 1;
      return;
    }

    for ( const page of pages ) {
      page.symbols = [];
      for ( const file of page.files ) page.symbols.push(...await this._parseFile(file));
    }

    this._links = this._buildLinks(pages);

    if ( !names.length ) {
      for ( const dir of ['elements', 'utils'] ) {
        await fs.rm(path.join(REFERENCE_DIR, dir), { recursive: true, force: true });
      }
    }

    // Pages are one folder down from the index, so their {@link} targets are relative to the parent folder
    this._linkPrefix = '../';
    for ( const page of pages ) {
      if ( names.length && !names.includes(page.name) ) continue;
      await this._write(page.dest, await this._renderPage(page), { sources: page.files });
    }
    this._linkPrefix = '';
    await this._write('readme.md', this._renderIndex(pages), { sources: ['package/elements', 'package/utils'] });
  }

  /**
   * @description Builds the targets that {@link} tags can point to (see _renderLinks), from every page:
   * - An element's tag name (cork-header) and class name (CorkHeader), to its page.
   * - A util's class, function, const or typedef name (NavController, NavItem), to its heading on the util page.
   * - A member, as Name#member (NavController#parse, CorkSearchTray#focus, cork-search-tray#focus), to its heading.
   * @param {Object[]} pages - Every page from _listPages, with its symbols.
   * @returns {Object} Targets keyed by name, each with dest (relative to docs/reference) and anchor (empty for a whole page).
   */
  _buildLinks(pages) {
    const links = {};
    const addMembers = (names, symbol, dest) => {
      for ( const member of [...symbol.members, ...symbol.tplFunctions] ) {
        const anchor = this._slug(this._title({ ...member, members: [], tplFunctions: [] }));
        names.forEach(name => links[`${name}#${member.name}`] = { dest, anchor });
      }
    };

    for ( const page of pages ) {
      if ( page.kind === 'element' ) {
        const cls = page.symbols.find(symbol => symbol.kind === 'class');
        const names = [page.name, cls?.name].filter(Boolean);
        names.forEach(name => links[name] = { dest: page.dest, anchor: '' });
        if ( cls ) addMembers(names, cls, page.dest);
        continue;
      }
      for ( const symbol of page.symbols ) {
        links[symbol.name] = { dest: page.dest, anchor: this._slug(this._title(symbol)) };
        addMembers([symbol.name], symbol, page.dest);
      }
    }
    return links;
  }

  /**
   * @description Turns {@link} tags in prose into markdown links, using the targets from _buildLinks.
   * Supports {@link name}, {@link name|text} and {@link name text}. With no text, the name is shown in code.
   * An unknown name is shown in code, and a warning is logged.
   * @param {String} text - Prose, already escaped.
   * @returns {String}
   */
  _renderLinks(text) {
    return text.replace(/\{@link(?:code|plain)?\s+([^\s|}]+)(?:\s*\|\s*|\s+)?([^}]*)\}/g, (match, name, label) => {
      const target = this._links?.[name];
      label = label.trim();
      if ( !target ) {
        console.warn(`Unknown {@link ${name}}`);
        return label || `\`${name}\``;
      }
      const href = this._linkPrefix + target.dest + (target.anchor ? `#${target.anchor}` : '');
      return `[${label || `\`${name}\``}](${href})`;
    });
  }

  /**
   * @description Lists the reference pages and their source files.
   * Elements: elements/<name>/<name>.js. Utils: every .js file in utils/<folder>, except *.tpl.js, with index.js first.
   * @returns {Promise<Object[]>} Pages, each with name, kind ('element' or 'util'), files (absolute paths), and dest (relative to docs/reference).
   */
  async _listPages() {
    const pages = [];

    for ( const name of await this._listDirs(ELEMENTS_DIR) ) {
      const file = path.join(ELEMENTS_DIR, name, `${name}.js`);
      try {
        await fs.access(file);
      } catch (e) {
        continue;
      }
      pages.push({ name, kind: 'element', files: [file], dest: `elements/${name}.md` });
    }

    for ( const name of await this._listDirs(UTILS_DIR) ) {
      const dir = path.join(UTILS_DIR, name);
      const files = (await fs.readdir(dir))
        .filter(file => file.endsWith('.js') && !file.endsWith('.tpl.js'))
        .sort((a, b) => (b === 'index.js') - (a === 'index.js') || a.localeCompare(b))
        .map(file => path.join(dir, file));
      pages.push({ name, kind: 'util', files, dest: `utils/${name}.md` });
    }

    return pages;
  }

  /**
   * @description Lists the subdirectories of a directory, sorted.
   * @param {String} dir - Absolute path.
   * @returns {Promise<String[]>} Directory names.
   */
  async _listDirs(dir) {
    return (await fs.readdir(dir, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
  }

  /**
   * @description Parses a source file's doc blocks into the symbols it documents.
   * A block's symbol is found from the first code line after it (see _identify). An indented method belongs to the class or const above it.
   * Functions imported from a sibling *.tpl.js file are followed, and their JSDoc added to the file's class (see _followTplImports).
   * @param {String} file - Absolute path.
   * @returns {Promise<Object[]>} Symbols, each with kind ('class', 'function', 'const' or 'typedef'), name, doc (see _normalizeDoc),
   * members, and tplFunctions.
   */
  async _parseFile(file) {
    const source = await fs.readFile(file, 'utf8');
    const lines = source.split('\n');
    const symbols = [];
    let container = null;

    for ( const block of parse(source, { spacing: 'preserve' }) ) {
      const doc = this._normalizeDoc(block);
      if ( doc.private ) continue;

      if ( doc.typedef ) {
        symbols.push({ kind: 'typedef', name: doc.typedef.name, doc, members: [], tplFunctions: [] });
        continue;
      }

      const end = block.source.at(-1).number;
      const line = lines.slice(end + 1).find(line => line.trim());
      const id = line ? this._identify(line) : null;
      if ( !id || id.name.startsWith('_') ) continue;

      if ( id.kind === 'method' ) {
        const excluded = LIFECYCLE.includes(id.name) || (id.isStatic && STATIC_EXCLUDED.includes(id.name));
        if ( container && !excluded ) container.members.push({ ...id, doc });
        continue;
      }
      if ( !this._isExported(source, id.name) ) {
        container = null;
        continue;
      }
      container = { ...id, doc, members: [], tplFunctions: [], file, isDefault: this._isDefaultExport(source, id.name) };
      symbols.push(container);
    }

    await this._followTplImports(source, file, symbols);
    return symbols;
  }

  /**
   * @description Works out what a doc block documents from the first code line after it.
   * @param {String} line - The code line.
   * @returns {Object|null} kind ('class', 'function', 'const' or 'method') and name. Methods also have isStatic and isGetter.
   * Null if the line isn't a declaration, e.g. a property assignment in a constructor.
   */
  _identify(line) {
    let match = line.match(/^(?:export\s+)?(?:default\s+)?class\s+([\w$]+)/);
    if ( match ) return { kind: 'class', name: match[1] };

    match = line.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([\w$]+)/);
    if ( match ) return { kind: 'function', name: match[1] };

    match = line.match(/^(?:export\s+)?(?:const|let)\s+([\w$]+)\s*=/);
    if ( match ) return { kind: 'const', name: match[1] };

    match = line.match(/^\s+(static\s+)?(?:async\s+)?(get\s+|set\s+)?([\w$]+)\s*\(/);
    if ( match && !NOT_METHODS.includes(match[3]) ) {
      return { kind: 'method', name: match[3], isStatic: !!match[1], isGetter: match[2]?.trim() === 'get' };
    }
    return null;
  }

  /**
   * @description Whether a top-level name is exported from a source file.
   * @param {String} source - The file's source.
   * @param {String} name - The class, function, or const name.
   * @returns {Boolean}
   */
  _isExported(source, name) {
    const declared = new RegExp(`^export\\s+(default\\s+)?(async\\s+)?(class|function|const|let)\\s+${name}\\b`, 'm');
    const byName = new RegExp(`^export\\s+default\\s+${name}\\s*;?\\s*$`, 'm');
    const inList = new RegExp(`^export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`, 'm');
    return declared.test(source) || byName.test(source) || inList.test(source);
  }

  /**
   * @description Whether a top-level name is a source file's default export.
   * @param {String} source - The file's source.
   * @param {String} name - The class, function, or const name.
   * @returns {Boolean}
   */
  _isDefaultExport(source, name) {
    return new RegExp(`^export\\s+default\\s+((async\\s+)?(class|function)\\s+)?${name}\\b`, 'm').test(source);
  }

  /**
   * @description The import statements for a util page's symbols. A symbol in the folder's index.js, or in a file the index.js
   * imports from, is imported by name from the folder. Any other file's symbols are imported from the file itself.
   * @param {Object} page - A util page from _listPages, with its symbols.
   * @returns {Promise<String[]>} Import statements, one per import path.
   */
  async _importLines(page) {
    const dir = path.join(UTILS_DIR, page.name);
    const folderPath = `${IMPORT_PATH}/utils/${page.name}`;
    let index = '';
    try {
      index = await fs.readFile(path.join(dir, 'index.js'), 'utf8');
    } catch (e) {}

    const byPath = new Map();
    for ( const symbol of page.symbols.filter(symbol => symbol.file) ) {
      const file = path.basename(symbol.file);
      const viaIndex = file === 'index.js' || index.includes(`'./${file}'`) || index.includes(`"./${file}"`);
      const importPath = viaIndex ? folderPath : `${folderPath}/${file}`;
      const names = byPath.get(importPath) || { named: [], default: null };
      if ( !viaIndex && symbol.isDefault ) names.default = symbol.name;
      else names.named.push(symbol.name);
      byPath.set(importPath, names);
    }

    return [...byPath].map(([importPath, names]) => {
      const parts = [names.default, names.named.length ? `{ ${names.named.join(', ')} }` : ''].filter(Boolean);
      return `import ${parts.join(', ')} from '${importPath}';`;
    });
  }

  /**
   * @description Follows functions imported from a sibling *.tpl.js file, and adds their JSDoc to the file's (first) class.
   * this.<name> = <fn>.bind(this) becomes a method, and a static getter that returns <fn>(...) becomes that getter.
   * Any other imported function goes in the class's tplFunctions, under its own name. render and styles are skipped (see TPL_EXCLUDED).
   * @param {String} source - The importing file's source.
   * @param {String} file - The importing file's absolute path.
   * @param {Object[]} symbols - The file's symbols, from _parseFile. Modified in place.
   * @returns {Promise<void>}
   */
  async _followTplImports(source, file, symbols) {
    const cls = symbols.find(symbol => symbol.kind === 'class');
    if ( !cls ) return;

    for ( const [, list, tplPath] of source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"](\.\/[^'"]+\.tpl\.js)['"]/gm) ) {
      const imported = list.split(',').map(name => name.trim()).filter(name => name && !TPL_EXCLUDED.includes(name));
      if ( !imported.length ) continue;

      const tplSymbols = await this._parseFile(path.join(path.dirname(file), tplPath));
      for ( const fn of imported ) {
        const tplSymbol = tplSymbols.find(symbol => symbol.kind === 'function' && symbol.name === fn);
        if ( !tplSymbol ) continue;

        const bound = source.match(new RegExp(`this\\.([\\w$]+)\\s*=\\s*${fn}\\.bind\\(this\\)`));
        const getter = source.match(new RegExp(`static\\s+get\\s+([\\w$]+)\\s*\\(\\)\\s*\\{\\s*return\\s+${fn}\\(`));
        const member = bound ? { name: bound[1], isStatic: false, isGetter: false } :
          getter ? { name: getter[1], isStatic: true, isGetter: true } : null;

        if ( !member ) {
          cls.tplFunctions.push({ kind: 'function', name: fn, doc: tplSymbol.doc });
          continue;
        }
        if ( TPL_EXCLUDED.includes(member.name) || cls.members.some(m => m.name === member.name) ) continue;
        cls.members.push({ kind: 'method', ...member, doc: tplSymbol.doc });
      }
    }
  }

  /**
   * @description Turns a comment-parser block into the fields the pages use. Normalizes our mixed tag styles:
   * @classdesc and the untagged description become the description, and @examples becomes @example.
   * @class, @method, @function and @type are ignored; names come from the code.
   * @param {Object} block - A comment-parser block.
   * @returns {Object} description, params, returns, properties, slots, events, examples (see _parseExample), typedef, and private.
   */
  _normalizeDoc(block) {
    const doc = {
      description: block.description.trim(),
      params: [],
      returns: null,
      properties: [],
      slots: [],
      events: [],
      examples: [],
      typedef: null,
      private: false
    };

    for ( const tag of block.tags ) {
      const name = ALIASES[tag.tag] || tag.tag;
      const entry = { name: tag.name, type: tag.type, optional: tag.optional, default: tag.default, description: this._stripDash(tag.description) };

      if ( name === 'description' ) doc.description = [doc.description, this._tagText(tag)].filter(Boolean).join('\n');
      else if ( name === 'example' ) doc.examples.push(this._parseExample(this._tagText(tag)));
      else if ( name === 'param' ) doc.params.push(entry);
      else if ( name === 'property' ) doc.properties.push(entry);
      else if ( name === 'slot' ) doc.slots.push({ ...entry, name: entry.name === '-' ? '' : entry.name });
      else if ( name === 'event' || name === 'fires' ) doc.events.push(entry);
      else if ( name === 'returns' || name === 'return' ) doc.returns = { type: tag.type, description: this._stripDash(this._tagText(tag)) };
      else if ( name === 'typedef' ) doc.typedef = { name: tag.name, type: tag.type };
      else if ( name === 'private' ) doc.private = true;
    }
    return doc;
  }

  /**
   * @description A tag's full text after its type, keeping line breaks and indentation, for tags whose content isn't a name
   * (e.g. @description, @example, @returns). comment-parser otherwise takes the first word as the name.
   * @param {Object} tag - A comment-parser tag.
   * @returns {String}
   */
  _tagText(tag) {
    const lines = tag.source
      .filter(line => !line.tokens.end)
      .map((line, i) => {
        const t = line.tokens;
        return i === 0 ? t.name + t.postName + t.description : t.postDelimiter.slice(1) + t.description;
      });
    return lines.join('\n').trim();
  }

  /**
   * @description Splits an @example's text into its optional caption and its code, and works out the code's language.
   * A caption is standard JSDoc: <caption>…</caption> at the start of the example, e.g. @example <caption>Rendering</caption>.
   * If the code has its own ``` fences, they're kept as written, so an example can set its language (```html) or hold several blocks.
   * VS Code hovers render fenced examples the same way. Otherwise the language is detected (see _exampleLang).
   * @param {String} text - The example's text, from _tagText.
   * @returns {Object} caption (String, empty if none), code (String), fenced (Boolean), and lang ('html' or 'js', if not fenced).
   */
  _parseExample(text) {
    const match = text.match(/^<caption>([\s\S]*?)<\/caption>/);
    const caption = match ? match[1].trim() : '';
    const code = match ? text.slice(match[0].length).replace(/^[ \t]*\n/, '') : text;
    const fenced = /^\s*```/m.test(code);
    return { caption, code, fenced, lang: fenced ? '' : this._exampleLang(code) };
  }

  /**
   * @description Detects an unfenced example's language: html if its first non-blank line starts with <, otherwise js.
   * e.g. element markup (including tags whose attributes span several lines) is html, and imports are js.
   * For anything else, fence the example yourself.
   * @param {String} code - The example's code.
   * @returns {String} 'html' or 'js'.
   */
  _exampleLang(code) {
    const first = code.split('\n').map(line => line.trim()).find(Boolean);
    return first?.startsWith('<') ? 'html' : 'js';
  }

  /**
   * @description Removes the leading '- ' that separates a tag's name from its description.
   * @param {String} text - The description.
   * @returns {String}
   */
  _stripDash(text) {
    return text.replace(/^\s*-\s*/, '').trim();
  }

  /**
   * @description Renders a reference page. An element page is headed by the element name, with its class's sections at level 2.
   * A util page starts with its import statements (see _importLines), then has a level 2 section per class, function, const, or typedef.
   * @param {Object} page - A page from _listPages, with its symbols.
   * @returns {Promise<String>} Markdown.
   */
  async _renderPage(page) {
    const out = [`# ${page.name}`, ''];

    if ( page.kind === 'element' ) {
      const cls = page.symbols.find(symbol => symbol.kind === 'class');
      if ( cls ) out.push(...this._renderSymbol(cls, 2, { noHeading: true }));
      const typedefs = page.symbols.filter(symbol => symbol.kind === 'typedef');
      if ( typedefs.length ) {
        out.push('## Typedefs', '');
        typedefs.forEach(symbol => out.push(...this._renderSymbol(symbol, 3)));
      }
      page.symbols.filter(symbol => symbol !== cls && symbol.kind !== 'typedef')
        .forEach(symbol => out.push(...this._renderSymbol(symbol, 2)));
    } else {
      const imports = await this._importLines(page);
      if ( imports.length ) out.push('```js', ...imports, '```', '');
      const body = page.symbols.flatMap(symbol => this._renderSymbol(symbol, 2));
      out.push(...this._toc(body), ...body);
    }

    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  /**
   * @description Builds a table of contents for a util page: a link to each level 2 heading (class, function, const or typedef),
   * with its level 4 headings (methods and template functions) nested below it.
   * Anchors are slugged as GitHub and VS Code do (see _slug), counting every heading so repeated ones get the same -1, -2 suffixes.
   * @param {String[]} lines - The page body's markdown lines, from _renderSymbol.
   * @returns {String[]} Markdown lines, ending with a blank line. Empty if the body has no headings.
   */
  _toc(lines) {
    const seen = {};
    const out = [];
    let inFence = false;

    for ( const line of lines ) {
      if ( line.startsWith('```') ) inFence = !inFence;
      const match = !inFence && line.match(/^(#{2,6}) (.+)$/);
      if ( !match ) continue;

      let slug = this._slug(match[2]);
      if ( seen[slug] !== undefined ) slug = `${slug}-${++seen[slug]}`;
      else seen[slug] = 0;

      const level = match[1].length;
      if ( level === 2 ) out.push(`- [${match[2]}](#${slug})`);
      else if ( level === 4 ) out.push(`  - [${match[2]}](#${slug})`);
    }
    return out.length ? ['## Contents', '', ...out, ''] : [];
  }

  /**
   * @description Turns heading text into its anchor, as GitHub and VS Code do: lowercased, punctuation removed, spaces to hyphens.
   * Doesn't add the suffix for repeated headings; see _toc.
   * @param {String} text - The heading text, e.g. 'renderItem(item, opts)'.
   * @returns {String} e.g. 'renderitemitem-opts'
   */
  _slug(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
  }

  /**
   * @description Renders a symbol: its heading, description, tables, members, template functions and examples. Empty sections are left out.
   * @param {Object} symbol - A symbol from _parseFile, or a member.
   * @param {Number} level - Heading level of the symbol. Its sections are one level lower.
   * @param {Object} opts - Options.
   * @param {Boolean} opts.noHeading - Leaves out the symbol's own heading, e.g. on an element page, which is headed by the element name.
   * @returns {String[]} Markdown lines.
   */
  _renderSymbol(symbol, level, opts={}) {
    const { doc } = symbol;
    const h = '#'.repeat(level);
    const sub = '#'.repeat(level + 1);
    const out = [];

    if ( !opts.noHeading ) out.push(`${h} ${this._title(symbol)}`, '');
    if ( symbol.kind === 'typedef' ) out.push(`Typedef: \`${doc.typedef.type || 'Object'}\``, '');
    if ( doc.description ) out.push(this._escape(doc.description), '');

    if ( doc.params.length ) {
      out.push(...this._table(['Param', 'Type', 'Description'], doc.params.map(p => [this._paramName(p), this._code(p.type), p.description])));
    }
    if ( doc.returns ) {
      out.push(`**Returns:** ${[this._code(doc.returns.type), this._escape(doc.returns.description)].filter(Boolean).join(' - ')}`, '');
    }

    const sections = opts.noHeading ? h : sub;
    if ( doc.properties.length ) {
      out.push(`${sections} Properties`, '');
      out.push(...this._table(['Name', 'Type', 'Description'], doc.properties.map(p => [this._paramName(p), this._code(p.type), p.description])));
    }
    if ( doc.slots.length ) {
      out.push(`${sections} Slots`, '');
      out.push(...this._table(['Name', 'Description'], doc.slots.map(s => [s.name ? this._code(s.name) : '(default)', s.description])));
    }
    if ( doc.events.length ) {
      out.push(`${sections} Events`, '');
      out.push(...this._table(['Name', 'Description'], doc.events.map(e => [this._code(e.name), e.description])));
    }
    if ( symbol.members.length ) {
      out.push(`${sections} Methods`, '');
      symbol.members.forEach(member => out.push(...this._renderSymbol({ ...member, members: [], tplFunctions: [] }, sections.length + 1)));
    }
    if ( symbol.tplFunctions.length ) {
      out.push(`${sections} Template functions`, '');
      symbol.tplFunctions.forEach(fn => out.push(...this._renderSymbol({ ...fn, members: [], tplFunctions: [] }, sections.length + 1)));
    }
    if ( doc.examples.length ) {
      out.push(`${sections} Examples`, '');
      doc.examples.forEach(example => {
        if ( example.caption ) out.push(`**${this._escape(example.caption)}**`, '');
        out.push(...(example.fenced ? [example.code] : ['```' + example.lang, example.code, '```']), '');
      });
    }
    return out;
  }

  /**
   * @description A symbol's heading text, e.g. 'NavController', 'focus(opts)', 'static define(tagName)' or 'static get drillDownStyles'.
   * @param {Object} symbol - A symbol or member.
   * @returns {String}
   */
  _title(symbol) {
    if ( symbol.kind === 'class' || symbol.kind === 'typedef' ) return symbol.name;
    const prefix = (symbol.isStatic ? 'static ' : '') + (symbol.isGetter ? 'get ' : '');
    if ( symbol.isGetter ) return prefix + symbol.name;
    const args = symbol.doc.params.filter(p => !p.name.includes('.')).map(p => p.name);
    if ( symbol.kind === 'const' && !args.length ) return symbol.name;
    return `${prefix}${symbol.name}(${args.join(', ')})`;
  }

  /**
   * @description A param or property name for a table: in code, with (optional) and the default value if given.
   * @param {Object} entry - A param or property.
   * @returns {String}
   */
  _paramName(entry) {
    let name = this._code(entry.name);
    if ( entry.optional ) name += ' (optional)';
    if ( entry.default !== undefined ) name += ` Default: ${this._code(entry.default)}`;
    return name;
  }

  /**
   * @description Renders a markdown table. The last column is prose: it's escaped (see _escape), | is escaped,
   * and its line breaks are kept as HTML, since a table cell can't hold paragraphs or lists:
   * a blank line becomes <br><br>, a '- ' list item starts a new line with a bullet, and any other line break becomes a space.
   * Other columns are already in code (from _code), and only have their line breaks flattened.
   * @param {String[]} headers - Column headers.
   * @param {String[][]} rows - Cell text, one array per row.
   * @returns {String[]} Markdown lines, ending with a blank line.
   */
  _table(headers, rows) {
    const flat = text => (text || '').replace(/\s*\n\s*/g, ' ');
    const prose = text => this._escape(text)
      .replace(/\n[ \t]*-[ \t]+/g, '\n• ')
      .replace(/[ \t]*\n[ \t]*\n\s*/g, '<br><br>')
      .replace(/[ \t]*\n(?=• )/g, '<br>')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/\|/g, '\\|');
    return [
      `| ${headers.join(' | ')} |`,
      `| ${headers.map(() => '---').join(' | ')} |`,
      ...rows.map(row => `| ${row.map((text, i) => i === row.length - 1 ? prose(text) : flat(text)).join(' | ')} |`),
      ''
    ];
  }

  /**
   * @description Wraps text in a markdown code span, escaping | for use in tables.
   * @param {String} text - The text, e.g. a type like 'String|String[]'.
   * @returns {String} Empty if no text.
   */
  _code(text) {
    return text ? `\`${text.replace(/\|/g, '\\|')}\`` : '';
  }

  /**
   * @description Escapes prose for markdown, so that element names like <cork-header> aren't read as HTML,
   * and the $ in template expressions like ${item.render()} isn't read as inline math (VS Code and GitHub render $…$ as KaTeX).
   * Then turns {@link} tags into links (see _renderLinks).
   * @param {String} text - The text.
   * @returns {String}
   */
  _escape(text) {
    return this._renderLinks((text || '').replace(/</g, '&lt;').replace(/\$/g, '\\$'));
  }

  /**
   * @description Renders docs/reference/readme.md: each element with the first sentence of its description, and each util folder
   * with the names it documents.
   * @param {Object[]} pages - Every page from _listPages, with its symbols.
   * @returns {String} Markdown.
   */
  _renderIndex(pages) {
    const out = [
      '# Reference',
      '',
      'Generated from the JSDoc in the package source. To rebuild, run `./devops/cmds/run-package-tool.sh docs jsdoc`,',
      'or `docs jsdoc <name>` for one page.',
      '',
      '## Elements',
      ''
    ];
    for ( const page of pages.filter(page => page.kind === 'element') ) {
      const description = page.symbols.find(symbol => symbol.kind === 'class')?.doc.description || '';
      out.push(`- [${page.name}](${page.dest}): ${this._escape(this._firstSentence(description))}`);
    }
    out.push('', '## Utils', '');
    for ( const page of pages.filter(page => page.kind === 'util') ) {
      const names = page.symbols.filter(symbol => symbol.kind !== 'typedef').map(symbol => `\`${symbol.name}\``);
      out.push(`- [${page.name}](${page.dest}): ${names.join(', ')}`);
    }
    return out.join('\n') + '\n';
  }

  /**
   * @description The first sentence of a description, on one line.
   * @param {String} text - The description.
   * @returns {String}
   */
  _firstSentence(text) {
    const flat = text.replace(/\s+/g, ' ').trim();
    const match = flat.match(/^.*?[.!?](?=\s|$)/);
    return match ? match[0] : flat;
  }

  /**
   * @description Writes a page to docs/reference, with a header comment saying it's generated.
   * @param {String} dest - Path relative to docs/reference.
   * @param {String} markdown - The page.
   * @param {Object} opts - Options.
   * @param {String[]} opts.sources - Source files or folders, absolute or relative to services/. Listed in the header comment.
   * @param {Boolean} opts.quiet - Don't log the write.
   * @returns {Promise<void>}
   */
  async _write(dest, markdown, opts={}) {
    const servicesDir = path.dirname(PACKAGE_DIR.replace(/\/$/, ''));
    const sources = (opts.sources || []).map(source => path.isAbsolute(source) ? path.relative(servicesDir, source) : source);
    const header = `<!-- Autogenerated by \`package-tools docs jsdoc\` from ${sources.join(', ')}. Do not edit by hand. -->`;

    const destPath = path.join(REFERENCE_DIR, dest);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, header + '\n\n' + markdown);
    if ( !opts.quiet ) console.log(`Wrote docs/reference/${dest}`);
  }

}

export default new Docs();
