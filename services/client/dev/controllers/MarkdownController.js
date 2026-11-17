import { html } from 'lit';
import { Lexer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { Registry } from '@ucd-lib/cork-app-utils';
import AppComponentController from './AppComponentController.js';
import { highlight } from '../lib/prism.js';

import '@ucd-lib/cork-theme/elements/cork-markdown';

/**
 * @description App routes for docs, as [pattern, replacement] pairs, checked in order against a doc's path from the docs root (e.g. '/reference/elements/cork-header.md').
 * Links to a doc that matches no pattern are rendered as plain text. Add a pair here when a route is added for more docs.
 * @type {Array<[RegExp, String]>}
 */
const DOC_ROUTES = [
  [/^\/reference\/elements\/([^/]+)\.md$/, '/elements/$1'],
  [/^\/reference\/utils\/([^/]+)\/readme\.md$/, '/utils/$1'],
  [/^\/reference\/utils\/controllers\/([^/]+)\.md$/, '/utils/controllers/$1'],
  [/^\/reference\/utils\/([^/]+)\.md$/, '/utils/$1']
];

// cache key for _markedOptions when no options are given
const NO_MARKED_OPTIONS = {};

// marked extension that highlights fenced code blocks with Prism, adding a language-* class to the code element
const HIGHLIGHT = markedHighlight({ langPrefix: 'language-', highlight });

/**
 * @description Controller that loads a markdown document from the DocModel for its host, and reloads it on app state updates while the host is on the active page.
 * @param {LitElement} host - The host element
 * @param {String|Function} docPath - Path of the document to load, e.g. 'reference/elements/cork-header.md'.
 * Or a function that is called with the app state and returns the path. A falsy path clears the document.
 * @param {Object} opts - Options
 * @param {Array<[RegExp, String]>} opts.routes - App routes for docs, used to rewrite links between docs. Default: DOC_ROUTES
 *
 * Relative links between docs (e.g. '../elements/cork-header.md#slots') are rewritten to their app route ('/elements/cork-header#slots').
 * A link to a doc with no route is rendered as plain text. Links with a scheme, and #hash only links, are left alone.
 * When a document loads, the page scrolls to the URL's #hash, if any. Fenced code blocks are highlighted with Prism (see lib/prism.js).
 * @property {HTMLElement} host - The host element
 * @property {String|Function} docPath - The docPath argument
 * @property {Object} opts - The opts argument
 * @property {Object} models - The AppStateModel and DocModel
 * @property {AppComponentController} appComponentController - Tells whether the host is on the active page
 * @property {String|null} document - The loaded markdown (the DocModel payload), or null if none is loaded or it failed to load
 * @example <caption>Load a document with a static path</caption>
 * this.ctl = {
 *   markdown: new MarkdownController(this, 'reference/elements/cork-header.md')
 * };
 * 
 * @example <caption>Load a document based on the current location</caption>
 * this.ctl = {
 *   markdown: new MarkdownController(this, e => `reference/${e.location.path.slice(0,2).join('/')}.md`)
 * };
 */
export default class MarkdownController {

  constructor(host, docPath, opts={}) {
    this.host = host;
    this.docPath = docPath;
    this.opts = opts;
    this.routes = opts.routes || DOC_ROUTES;

    this.models = {
      AppStateModel: Registry.getModel('AppStateModel'),
      DocModel: Registry.getModel('DocModel')
    }

    this.appComponentController = new AppComponentController(host);

    this.document = null;
    this._tokens = null;
    this._tokensDocument = null;
    this._docPath = null;
    this._markedOptionsCache = new WeakMap();
    this._markedOptionsCacheDocPath = null;
    this._lastScrollKey = null;
    this._rewriteLink = this._rewriteLink.bind(this);
    this._onAppStateUpdate = this._onAppStateUpdate.bind(this);

    host.addController(this);
  }

  /**
   * @description Renders the whole loaded document with a cork-markdown element.
   * @param {Object} opts - Options
   * @param {Boolean} opts.stripTopHeading - Leaves out the top-level (h1) headings, e.g. when the page shows its own title. Default: false
   * @param {Boolean} opts.stripIntro - Leaves out the intro (see renderIntro), e.g. when the page shows it elsewhere. Default: false
   * @param {Object|Object[]} opts.markedOptions - Passed to the cork-markdown element's markedOptions.
   * @returns {TemplateResult}
   */
  render(opts={}){
    if ( !opts.stripTopHeading && !opts.stripIntro ) return this._render(this.document, opts);
    const [introStart, introEnd] = opts.stripIntro ? this._getIntroRange() : [0, 0];
    const markdown = this._getTokens()
      .filter((t, i) => {
        if ( opts.stripTopHeading && t.type === 'heading' && t.depth === 1 ) return false;
        return i < introStart || i >= introEnd;
      })
      .map(t => t.raw)
      .join('');
    return this._render(markdown, opts);
  }

  /**
   * @description Renders only the loaded document's intro: everything after its top-level heading (first h1), up to the next heading.
   * Renders nothing if the document has no intro.
   * @param {Object} opts - Options
   * @param {Object|Object[]} opts.markedOptions - Passed to the cork-markdown element's markedOptions.
   * @returns {TemplateResult}
   */
  renderIntro(opts={}){
    return this._render(this.getIntroMarkdown(), opts);
  }

  /**
   * @description Gets the markdown of the loaded document's intro. See renderIntro.
   * @returns {String} The intro's markdown, or '' if there is none.
   */
  getIntroMarkdown(){
    const [start, end] = this._getIntroRange();
    return this._getTokens().slice(start, end).map(t => t.raw).join('');
  }

  /**
   * @description Gets the token range of the loaded document's intro: from just after its first h1 (or the start, if it has none) to the next heading.
   * @returns {Number[]} [start, end] token indexes, end exclusive.
   */
  _getIntroRange(){
    const tokens = this._getTokens();
    const start = tokens.indexOf(this._getTitleToken()) + 1;
    const end = tokens.findIndex((t, i) => i >= start && t.type === 'heading');
    return [start, end === -1 ? tokens.length : end];
  }

  /**
   * @description Renders only the loaded document's top-level heading: its first h1. Renders nothing if it has none.
   * @param {Object} opts - Options
   * @param {Object|Object[]} opts.markedOptions - Passed to the cork-markdown element's markedOptions.
   * @returns {TemplateResult}
   */
  renderTitle(opts={}){
    return this._render(this._getTitleToken()?.raw, opts);
  }

  /**
   * @description Gets the loaded document's top-level heading (its first h1) as plain text, without markdown formatting,
   * e.g. for a page's own title element.
   * @returns {String} The heading's text, or '' if the document has no h1.
   */
  getTitle(){
    const toText = tokens => tokens.map(t => t.tokens ? toText(t.tokens) : (t.text || '')).join('');
    const heading = this._getTitleToken();
    return heading ? toText(heading.tokens || []).trim() : '';
  }

  /**
   * @description Gets the loaded document's first h1 heading token.
   * @returns {Object|undefined} marked heading token
   */
  _getTitleToken(){
    return this._getTokens().find(t => t.type === 'heading' && t.depth === 1);
  }

  /**
   * @description Renders markdown with a cork-markdown element, with links rewritten to app routes and code highlighted.
   * @param {String} markdown - The markdown to render.
   * @param {Object} opts - Options
   * @param {Object|Object[]} opts.markedOptions - Passed to the cork-markdown element's markedOptions, after the highlighting and link rewriting.
   * @returns {TemplateResult}
   */
  _render(markdown, opts={}){
    return html`<cork-markdown .markdown=${markdown || ''} .markedOptions=${this._markedOptions(opts.markedOptions)}></cork-markdown>`;
  }

  /**
   * @description Gets the markedOptions for a cork-markdown element: the Prism highlighting and link rewriting extensions, then the given options.
   * Cached per options object and doc, so the element isn't handed a new array (and re-parsed) on every render.
   * @param {Object|Object[]} markedOptions - marked options to add.
   * @returns {Object[]}
   */
  _markedOptions(markedOptions){
    if ( this._markedOptionsCacheDocPath !== this._docPath ) {
      this._markedOptionsCache = new WeakMap();
      this._markedOptionsCacheDocPath = this._docPath;
    }
    const key = markedOptions || NO_MARKED_OPTIONS;
    if ( !this._markedOptionsCache.has(key) ) {
      const options = [
        HIGHLIGHT,
        { walkTokens: this._rewriteLink },
        ...[].concat(markedOptions || [])
      ];
      this._markedOptionsCache.set(key, options);
    }
    return this._markedOptionsCache.get(key);
  }

  /**
   * @description marked walkTokens callback. Rewrites a relative link to another doc to its app route, keeping any query and #hash,
   * or turns it into plain text if the doc has no route. Links with a scheme (e.g. https:), starting with //, or #hash only are left alone.
   * @param {Object} token - marked token
   */
  _rewriteLink(token){
    if ( token.type !== 'link' || !token.href ) return;
    if ( /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(token.href) ) return;

    const url = new URL(token.href, `http://docs/${(this._docPath || '').replace(/^\/+/, '')}`);
    const rule = this.routes.find(([pattern]) => pattern.test(url.pathname));
    if ( !rule ) {
      token.type = 'text';
      return;
    }
    token.href = url.pathname.replace(rule[0], rule[1]) + url.search + url.hash;
  }

  /**
   * @description Renders one section of the loaded document: a heading, and everything after it up to the next heading of the same or a higher level.
   * Renders nothing if no heading matches.
   * @param {String} section - Text of the heading, e.g. 'Attributes and properties'. Matched trimmed and case-insensitive. The first match is used.
   * @param {Object} opts - Options
   * @param {Boolean} opts.stripTopHeading - Leaves out the section's own heading, rendering only its content. Default: false
   * @param {Object|Object[]} opts.markedOptions - Passed to the cork-markdown element's markedOptions.
   * @returns {TemplateResult}
   */
  renderSection(section, opts={}){
    return this._render(this.getSectionMarkdown(section, opts), opts);
  }

  /**
   * @description Gets the markdown of one section of the loaded document. See renderSection.
   * @param {String} section - Text of the heading.
   * @param {Object} opts - Options
   * @param {Boolean} opts.stripTopHeading - Leaves out the section's own heading. Default: false
   * @returns {String} The section's markdown, or '' if no heading matches.
   */
  getSectionMarkdown(section, opts={}){
    const tokens = this._getTokens();
    const name = (section || '').trim().toLowerCase();
    const start = tokens.findIndex(t => t.type === 'heading' && t.text.trim().toLowerCase() === name);
    if ( start === -1 ) return '';

    const depth = tokens[start].depth;
    let end = tokens.findIndex((t, i) => i > start && t.type === 'heading' && t.depth <= depth);
    if ( end === -1 ) end = tokens.length;

    const first = opts.stripTopHeading ? start + 1 : start;
    return tokens.slice(first, end).map(t => t.raw).join('');
  }

  /**
   * @description Gets the loaded document's top-level marked tokens, lexing it only when it has changed.
   * @returns {Object[]} marked tokens
   */
  _getTokens(){
    if ( this._tokensDocument !== this.document ) {
      this._tokens = this.document ? Lexer.lex(this.document) : [];
      this._tokensDocument = this.document;
    }
    return this._tokens || [];
  }

  /**
   * @description Loads the document at docPath from the DocModel into this.document, and requests a host update.
   * @returns {Promise<String|null>} The document, or null if there's no path or it failed to load.
   */
  async getDocument(){
    let docPath;
    if ( typeof this.docPath === 'function' ){
      docPath = this.docPath(this.models.AppStateModel.store.data);
    } else {
      docPath = this.docPath;
    }

    if ( !docPath ) {
      this.document = null;
    } else {
      const r = await this.models.DocModel.get(docPath);
      if ( r.state === 'error' ) {
        this.document = null;
      } else {
        this.document = r.payload;
      }
    }
    this._docPath = this.document ? docPath : null;

    this.host.requestUpdate();
    await this.scrollToHash();
    return this.document;
  }

  /**
   * @description Once the host and its cork-markdown elements have rendered, scrolls to the element whose id is the URL's #hash, if any.
   * Only scrolls once per doc and hash, so other app state updates don't move the page.
   */
  async scrollToHash(){
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    const key = `${this._docPath}#${hash}`;
    if ( !hash || !this.document || key === this._lastScrollKey ) return;

    await this.host.updateComplete;
    const eles = [...this.host.renderRoot.querySelectorAll('cork-markdown')];
    await Promise.all(eles.map(ele => ele.updateComplete));

    const target = this.host.renderRoot.getElementById?.(hash) || document.getElementById(hash);
    if ( !target ) return;
    this._lastScrollKey = key;
    target.scrollIntoView();
  }

  /**
   * @description Callback for the app-state-update event. Reloads the document if the host is on the active page.
   */
  _onAppStateUpdate(){
    if ( !this.appComponentController.isOnActivePage ) return;
    this.getDocument();
  }


  /**
   * @description Register event listeners when the host is connected to the DOM
   */
  hostConnected() {
    this.models.AppStateModel.EventBus.on('app-state-update', this._onAppStateUpdate);
  }

  /**
   * @description Remove event listeners when the host is disconnected from the DOM
   */
  hostDisconnected() {
    this.models.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate);
  }
}