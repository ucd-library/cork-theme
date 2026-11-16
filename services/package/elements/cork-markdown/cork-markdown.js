import { LitElement } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Marked, Renderer } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import DOMPurify from 'dompurify';

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';
import { Mixin, MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

/**
 * @description Renders markdown as sanitized HTML in the light DOM (no shadow root), so it inherits styles.
 *
 * - The markdown comes from the markdown property, or from a child script tag with type="text/markdown", 
 * which is reread whenever its text changes. 
 * - Uses marked and DOMPurify packages, for parsing and sanitization. Behavior can be customized via markedOptions property.
 * - Headings get GitHub-style ids (via marked-gfm-heading-id), with headingIdPrefix in front, e.g. '## Slots' gets id="md-slots".
 * The prefix stops DOMPurify from removing ids that match DOM properties, such as 'children' or 'title'.
 * Relative links with a #hash get the same prefix added, so `[Slots](#slots)` and `[Slots](other.md#slots)` still point at the heading.
 * @property {String} markdown - The markdown to render. Set from the "text/markdown" script child, if there is one. Attribute: markdown.
 * @property {Object|Object[]} markedOptions - Options for marked package, merged over the defaults: {breaks: true, gfm: true},
 * and custom list and table renderers that add certain theme classes.
 * Takes the same object as marked.use(), including renderer methods. See https://marked.js.org/using_advanced.
 * Or an array of them, applied in order, e.g. to add an extension such as marked-highlight alongside your own options. Property only.
 * @property {String} headingIdPrefix - Put in front of each heading's id, and of the #hash in relative links. Default: 'md-'. Attribute: heading-id-prefix.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-markdown';
 *
 * // or the class only, without registering the element:
 * import CorkMarkdown from '@ucd-lib/cork-theme/elements/cork-markdown/cork-markdown.js';
 *
 * @example <caption>Markdown in a script tag</caption>
 * <cork-markdown>
 *   <script type="text/markdown">
 *     ## A heading
 *     Some **bold** text, and a link: <https://library.ucdavis.edu>
 *
 *     1. First
 *     2. Second
 *        1. Nested
 *   </script>
 * </cork-markdown>
 *
 * @example <caption>Markdown property</caption>
 * <cork-markdown .markdown=${this.doc}></cork-markdown>
 *
 * @example <caption>Custom renderer method</caption>
 * // e.g. in a Lit template. Return false to fall back to the default renderer.
 * const markedOptions = {
 *   renderer: {
 *     heading({ tokens, depth }) {
 *       if ( depth !== 2 ) return false;
 *       return `<h2 class="heading--underline">${this.parser.parseInline(tokens)}</h2>`;
 *     }
 *   }
 * };
 * html`<cork-markdown .markdown=${this.doc} .markedOptions=${markedOptions}></cork-markdown>`;
 *
 * @example <caption>Syntax highlighting with marked-highlight and Prism</caption>
 * // npm install marked-highlight prismjs
 * // Neither is a dependency of this package. Prism's CSS (a theme, or your own .token rules) goes in the page's styles,
 * // since cork-markdown renders into the light DOM.
 * import { markedHighlight } from 'marked-highlight';
 * import Prism from 'prismjs';
 * import 'prismjs/components/prism-js-templates.js'; // import your languages.
 *
 * // create it once and reuse it: a new markedOptions value rebuilds the element's marked instance
 * const highlightExtension = markedHighlight({
 *   langPrefix: 'language-',
 *   highlight(code, lang) {
 *     const grammar = Prism.languages[lang];
 *     return grammar ? Prism.highlight(code, grammar, lang) : code;
 *   }
 * });
 *
 * // pass it alone. The default marked options still apply.
 * html`<cork-markdown .markdown=${this.doc} .markedOptions=${highlightExtension}></cork-markdown>`;
 *
 * // or in an array alongside your own options (also created once, not inline in the template)
 * const allOptions = [highlightExtension, markedOptions];
 * html`<cork-markdown .markdown=${this.doc} .markedOptions=${allOptions}></cork-markdown>`;
 */
export default class CorkMarkdown extends Mixin(LitElement)
  .with(MainDomElementMixin) {

  static get properties() {
    return {
      markdown: {type: String},
      markedOptions: {type: Object, attribute: false},
      headingIdPrefix: {type: String, attribute: 'heading-id-prefix'}
    }
  }

  constructor() {
    super();
    this.markdown = '';
    this.markedOptions = {};
    this.headingIdPrefix = 'md-';
    this._marked = null;
    this._html = '';
    this._scriptMarkdown = null;
    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true, subtree: true, characterData: true}, this._onChildListMutation)
    };
  }

  /**
   * @description Standard Lit lifecycle method. Rebuilds the marked instance when markedOptions or headingIdPrefix changes,
   * and re-renders the markdown to sanitized HTML when any property changes.
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props) {
    if ( props.has('markedOptions') || props.has('headingIdPrefix') || !this._marked ) {
      this._marked = new Marked(
        gfmHeadingId({prefix: this.headingIdPrefix || ''}),
        this._defaultMarkedOptions(),
        ...[].concat(this.markedOptions || [])
      );
    }
    if ( props.has('markdown') || props.has('markedOptions') || props.has('headingIdPrefix') ) {
      this._html = DOMPurify.sanitize(this._marked.parse(this.markdown || ''));
    }
  }

  /**
   * @description Standard Lit lifecycle method. Renders the sanitized HTML after any existing children, such as the script tag.
   * @returns {TemplateResult}
   */
  render() {
    return unsafeHTML(this._html);
  }

  /**
   * @description Gets the marked options that markedOptions are merged over.
   * @returns {Object}
   */
  _defaultMarkedOptions() {
    return {
      breaks: true,
      gfm: true,
      renderer: {
        list: this._listRenderer,
        table: this._tableRenderer
      },
      walkTokens: token => this._prefixLinkHash(token)
    };
  }

  /**
   * @description marked walkTokens callback. Adds headingIdPrefix to the #hash of a relative link, e.g. '#slots' or 'other.md#slots',
   * to match the heading ids. Links with a scheme (e.g. https:) or starting with // are left alone, as is a hash that already has the prefix.
   * @param {Object} token - marked token
   */
  _prefixLinkHash(token) {
    const prefix = this.headingIdPrefix;
    if ( !prefix || token.type !== 'link' || !token.href ) return;
    if ( /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(token.href) ) return;
    const i = token.href.indexOf('#');
    if ( i === -1 ) return;
    const hash = token.href.slice(i + 1);
    if ( !hash || hash.startsWith(prefix) ) return;
    token.href = `${token.href.slice(0, i)}#${prefix}${hash}`;
  }

  /**
   * @description marked renderer method for tables. Marked's own table, with the theme's table--bordered class, wrapped in a div with the responsive-table class, which scrolls wide tables sideways.
   * Called with the marked renderer as 'this'.
   * @param {Object} token - marked table token
   * @returns {String} HTML
   */
  _tableRenderer(token) {
    const table = Renderer.prototype.table.call(this, token).replace(/^<table>/, '<table class="table--bordered">');
    return `<div class="responsive-table">\n${table}</div>\n`;
  }

  /**
   * @description marked renderer method for lists. Same as marked's own, but adds the theme's list classes.
   * Called with the marked renderer as 'this'.
   * @param {Object} token - marked list token
   * @returns {String} HTML
   */
  _listRenderer(token) {
    let body = '';
    for ( const item of token.items ) {
      body += this.listitem(item);
    }
    const tag = token.ordered ? 'ol' : 'ul';
    const className = token.ordered ? 'list--multilevel' : 'list--bordered';
    const start = token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';
    return `<${tag} class="${className}"${start}>\n${body}</${tag}>\n`;
  }

  /**
   * @description Callback for the MutationObserverController. Sets markdown from the child script tag, if there is one and its text changed.
   * Also runs on the element's own renders, which leave the script's text alone.
   */
  _onChildListMutation() {
    const script = this.querySelector(':scope > script[type="text/markdown"]');
    if ( !script ) return;
    const markdown = this._dedent(script.textContent);
    if ( markdown === this._scriptMarkdown ) return;
    this._scriptMarkdown = markdown;
    this.markdown = markdown;
  }

  /**
   * @description Removes leading and trailing blank lines, and the indentation shared by all non-blank lines.
   * @param {String} text - The text to dedent.
   * @returns {String}
   */
  _dedent(text='') {
    const lines = text.replace(/\t/g, '  ').split('\n');
    while ( lines.length && !lines[0].trim() ) lines.shift();
    while ( lines.length && !lines[lines.length - 1].trim() ) lines.pop();
    const indents = lines.filter(line => line.trim()).map(line => line.match(/^ */)[0].length);
    const indent = indents.length ? Math.min(...indents) : 0;
    return lines.map(line => line.slice(indent)).join('\n');
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-markdown'
   */
  static define(tagName='cork-markdown'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
