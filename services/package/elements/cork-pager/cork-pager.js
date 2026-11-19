import { LitElement } from 'lit';
import { render, styles } from "./cork-pager.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A pager for navigating through pages of results: prev, a window of page numbers, and next.
 *
 * - The page numbers shown are centered on the current page where they can be. With ellipses (the default), the first and last pages are always shown,
 * and an ellipses stands in for each run of hidden pages, linking to the hidden page next to the shown ones. A run of just one page shows that page instead.
 * - Items are links if the pager can make them (see below), or else buttons that fire cork-pager-item-click. Prev and next are disabled at either end.
 * - Below 768px wide (the element's own width, not the window's), the pager switches to a mini view: prev, "Page X of Y", and next.
 * - Colors follow campus's --forced-contrast custom property, so the pager adapts on dark backgrounds, such as a campus section with force contrast.
 *
 * Links come from the first of these that's set:
 *
 * 1. The linkFunction property: a function called with (page, pager) that returns the link.
 * 2. A child script tag with type="text/link-function", holding a function expression called the same way. It's read with new Function,
 * so it needs a Content Security Policy that allows unsafe-eval (or no CSP). Otherwise, use the property.
 * 3. base-path, use-hash, query-params and page-param, e.g. /search/2, #/search/2, /search/2?q=cats, or /search?q=cats&page=2.
 *
 * With none of them, the items are buttons.
 * @property {Number} currentPage - The current page. Default: 1. Attribute: current-page.
 * @property {Number} maxPage - The number of pages. Default: 1. Attribute: max-page.
 * @property {Number} visibleLinkCount - How many page numbers to show, including the first and last. Default: 7. Attribute: visible-link-count.
 * @property {Boolean} noEllipses - Shows only a window of visibleLinkCount pages, without the first and last pages and ellipses. Attribute: no-ellipses.
 * @property {Boolean} staticEllipses - Makes ellipses plain text, rather than links to the next hidden page. Attribute: static-ellipses.
 * @property {Boolean} onlyMini - Always shows the mini view. Attribute: only-mini.
 * @property {Boolean} noMini - Never switches to the mini view on narrow widths. Attribute: no-mini.
 * @property {Boolean} noMaxOnMini - Leaves "of Y" out of the mini view's "Page X of Y". Attribute: no-max-on-mini.
 * @property {String} basePath - Path that page links start with, e.g. '/search' makes '/search/2'. Attribute: base-path.
 * @property {String} queryParams - Query string added to page links, e.g. 'q=cats'. Attribute: query-params.
 * @property {Boolean} useHash - Makes page links hash links, e.g. '#/search/2'. Attribute: use-hash.
 * @property {String} pageParam - Puts the page in this query parameter, rather than at the end of the path, e.g. 'page' makes '/search?page=2'.
 * Replaces the parameter if queryParams has it. Attribute: page-param.
 * @property {Function} linkFunction - Makes page links: called with (page, pager), returns the link, or nothing for no link. Overrides the link attributes and the script tag. Property only.
 * @property {String} navAriaLabel - Label for the nav. Default: 'Pagination'. Attribute: nav-aria-label.
 * @property {PagerItem[]} pagerItems - The items the pager renders, built by makePagerItems. Read only.
 * @slot - Not an actual slot. An optional script tag with type="text/link-function", holding a link function (see linkFunction). Reread when its text changes.
 * @event cork-pager-item-click - Fired when a page, ellipses, prev or next link or button is clicked, whether or not the pager has links. Bubbles and is composed.
 * Not fired for disabled buttons, or for link clicks with a modifier key or a non-primary button (e.g. ctrl/cmd-click to open a new tab), which are left to the browser.
 *
 * - detail.item: the clicked PagerItem (see below).
 * - detail.page: the page it goes to. The pager doesn't change currentPage itself: set it in response, or from your router.
 * - detail.originalEvent: the click event, e.g. to call preventDefault() on a link for an SPA router.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-pager';
 *
 * // or the class only, without registering the element:
 * import CorkPager from '@ucd-lib/cork-theme/elements/cork-pager/cork-pager.js';
 *
 * @example <caption>Links</caption>
 * <!-- /search/1, /search/2, ... -->
 * <cork-pager current-page="3" max-page="20" base-path="/search"></cork-pager>
 *
 * <!-- /search?q=cats&page=1, ... -->
 * <cork-pager current-page="3" max-page="20" base-path="/search" query-params="q=cats" page-param="page"></cork-pager>
 *
 * @example <caption>Link function property</caption>
 * pager.linkFunction = (page, pager) => `/search?page=${page}`;
 *
 * @example <caption>Link function script tag</caption>
 * <!-- needs a CSP that allows unsafe-eval, or no CSP -->
 * <cork-pager current-page="3" max-page="20">
 *   <script type="text/link-function">
 *     page => `/search?page=${page}`
 *   </script>
 * </cork-pager>
 *
 * @example <caption>Buttons</caption>
 * <!-- no links: items are buttons -->
 * <cork-pager current-page="3" max-page="20"></cork-pager>
 *
 * @example <caption>Handling button clicks</caption>
 * pager.addEventListener('cork-pager-item-click', e => {
 *   pager.currentPage = e.detail.page;
 *   loadResults(e.detail.page);
 * });
 *
 * @example <caption>Links in an SPA</caption>
 * pager.addEventListener('cork-pager-item-click', e => {
 *   e.detail.originalEvent.preventDefault();
 *   router.go(e.detail.item.link);
 * });
 *
 * @example <caption>Mini view</caption>
 * <!-- always mini, showing "Page 3" -->
 * <cork-pager current-page="3" max-page="20" only-mini no-max-on-mini></cork-pager>
 *
 * <!-- never mini -->
 * <cork-pager current-page="3" max-page="20" no-mini></cork-pager>
 */
export default class CorkPager extends LitElement {

  static get properties() {
    return {
      currentPage: { type: Number, attribute: 'current-page' },
      maxPage: { type: Number, attribute: 'max-page' },
      visibleLinkCount: { type: Number, attribute: 'visible-link-count' },
      noEllipses: { type: Boolean, attribute: 'no-ellipses' },
      staticEllipses: { type: Boolean, attribute: 'static-ellipses' },
      onlyMini: { type: Boolean, attribute: 'only-mini' },
      noMini: { type: Boolean, attribute: 'no-mini' },
      noMaxOnMini: { type: Boolean, attribute: 'no-max-on-mini' },
      basePath: { type: String, attribute: 'base-path' },
      queryParams: { type: String, attribute: 'query-params' },
      useHash: { type: Boolean, attribute: 'use-hash' },
      pageParam: { type: String, attribute: 'page-param' },
      navAriaLabel: { type: String, attribute: 'nav-aria-label' },
      linkFunction: { attribute: false },
      pagerItems: { state: true },
      _scriptLinkFunction: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.basePath = '';
    this.queryParams = '';
    this.useHash = false;
    this.pageParam = '';
    this.navAriaLabel = 'Pagination';
    this.linkFunction = null;
    this._scriptLinkFunction = null;
    this._scriptLinkFunctionText = null;

    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true, subtree: true, characterData: true}, this._onChildListMutation)
    };
  }

  /**
   * @description Standard Lit lifecycle method. On the first update, or when a property that affects the pager changes,
   * applies the defaults to the number properties, rounds them and keeps them at 1 or more, and rebuilds pagerItems.
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props){
    const rebuildProps = [
      'currentPage', 'maxPage', 'visibleLinkCount', 'noEllipses', 'staticEllipses',
      'basePath', 'queryParams', 'useHash', 'pageParam', 'linkFunction', '_scriptLinkFunction'
    ];
    if ( this.hasUpdated && !rebuildProps.some(p => props.has(p)) ) return;

    // setting properties in willUpdate doesn't trigger another update
    this.currentPage = this._toPositiveInteger(this.currentPage, 1);
    this.maxPage = this._toPositiveInteger(this.maxPage, 1);
    this.visibleLinkCount = this._toPositiveInteger(this.visibleLinkCount, 7);
    this.makePagerItems();
  }

  /**
   * @description Rounds a value to a whole number of at least 1, or gives the default if it isn't a number.
   * @param {*} value - The value, e.g. from an attribute.
   * @param {Number} defaultValue - Used if value isn't a number.
   * @returns {Number}
   */
  _toPositiveInteger(value, defaultValue){
    return Math.max(1, Math.round(Number(value)) || defaultValue);
  }

  /**
   * @description Builds pagerItems array to be rendered based on element properties.
   * @returns {PagerItem[]} The items, also set as pagerItems.
   */
  makePagerItems(){
    const maxPage = this.maxPage;
    const count = this.visibleLinkCount;
    // clamped here rather than in willUpdate, so a currentPage set before maxPage isn't lost
    const currentPage = Math.min(maxPage, this.currentPage);

    const pageItem = page => ({ type: 'page', page, current: page === currentPage, link: this.getLink(page) });
    // an ellipses goes to the hidden page next to the window of pages, unless staticEllipses is set
    const ellipsesItem = page => {
      if ( this.staticEllipses ) return { type: 'ellipses', page: null, current: false, link: null };
      return { type: 'ellipses', page, current: false, link: this.getLink(page) };
    };

    // Page items between first and last, inclusive: a window of up to size pages, as centered on the current page as it can be
    const pageRange = (first, last, size) => {
      size = Math.min(size, last - first + 1);
      const start = Math.min(Math.max(first, currentPage - Math.floor((size - 1) / 2)), last - size + 1);
      return Array.from({ length: size }, (_, i) => pageItem(start + i));
    };

    let pages;
    if ( maxPage <= count ) {
      pages = pageRange(1, maxPage, maxPage);
    } else if ( this.noEllipses || count < 3 ) {
      pages = pageRange(1, maxPage, count);
    } else {
      // first and last pages take two of the slots, and the rest are a window between them
      const middle = pageRange(2, maxPage - 1, count - 2);
      const first = middle[0].page;
      const last = middle[middle.length - 1].page;

      // the hidden pages before and after the window: none, one (shown in place of an ellipses), or more (an ellipses
      // that goes to adjacentPage, the hidden page next to the window)
      const gap = (from, to, adjacentPage) => {
        if ( to < from ) return [];
        if ( to === from ) return [pageItem(from)];
        return [ellipsesItem(adjacentPage)];
      };

      pages = [
        pageItem(1),
        ...gap(2, first - 1, first - 1),
        ...middle,
        ...gap(last + 1, maxPage - 1, last + 1),
        pageItem(maxPage)
      ];
    }

    const prevPage = Math.max(1, currentPage - 1);
    const nextPage = Math.min(maxPage, currentPage + 1);
    this.pagerItems = [
      { type: 'prev', page: prevPage, current: false, link: this.getLink(prevPage) },
      ...pages,
      { type: 'next', page: nextPage, current: false, link: this.getLink(nextPage) }
    ];
    return this.pagerItems;
  }

  /**
   * @description Gets the link for a page. Uses the first of these that's set:
   *
   * 1. The linkFunction property.
   * 2. A link function in a child script tag with type="text/link-function".
   * 3. basePath, useHash and pageParam. The page goes at the end of the path, e.g. '/search/2', or '#/search/2' with useHash,
   * plus '?' and queryParams, if set. With pageParam, the page goes in that query parameter instead, after queryParams,
   * e.g. '/search?q=cats&page=2'. With pageParam and no basePath, the link is only a query string, e.g. '?page=2', which keeps the current path.
   *
   * With none of them, pages have no link.
   * @param {Number} page - The page number.
   * @returns {String|null} The link, or null if there's none.
   */
  getLink(page){
    const linkFunction = this.linkFunction || this._scriptLinkFunction;
    if ( typeof linkFunction === 'function' ) {
      return linkFunction(page, this) || null;
    }
    if ( !this.basePath && !this.useHash && !this.pageParam ) return null;

    const hash = this.useHash ? '#' : '';
    let query = (this.queryParams || '').replace(/^\?/, '');

    if ( this.pageParam ) {
      const params = new URLSearchParams(query);
      params.set(this.pageParam, page);
      query = params.toString();
      return `${hash}${this.basePath || ''}?${query}`;
    }

    let path = this.basePath || '/';
    if ( !path.endsWith('/') ) path += '/';
    return `${hash}${path}${page}${query ? `?${query}` : ''}`;
  }

  /**
   * @description Callback for the MutationObserverController, which also runs when the element connects.
   * Reads the link function from the child script tag with type="text/link-function", if its text changed.
   * The script holds a function expression, called like linkFunction. If it doesn't evaluate to a function, it's ignored, with a console error.
   * Removing the script removes its function.
   */
  _onChildListMutation(){
    const script = this.querySelector(':scope > script[type="text/link-function"]');
    const text = script ? script.textContent.trim() : null;
    if ( text === this._scriptLinkFunctionText ) return;
    this._scriptLinkFunctionText = text;

    let linkFunction = null;
    if ( text ) {
      try {
        linkFunction = new Function(`return (${text});`)();
      } catch (e) {
        console.error('cork-pager: could not read the link function script', e);
      }
      if ( linkFunction && typeof linkFunction !== 'function' ) {
        console.error('cork-pager: the link function script must be a function expression');
        linkFunction = null;
      }
    }
    this._scriptLinkFunction = linkFunction;
  }

  /**
   * @description Click listener for a rendered link or button. Fires cork-pager-item-click,
   * except for link clicks with a modifier key or a non-primary button, so opening a link in a new tab or window isn't intercepted.
   * @param {PagerItem} item - The clicked item.
   * @param {MouseEvent} e - The click event.
   */
  _onItemClick(item, e){
    const isLink = e.currentTarget?.tagName === 'A';
    if ( isLink && (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) ) return;

    this.dispatchEvent(new CustomEvent('cork-pager-item-click', {
      detail: { item, page: item.page, originalEvent: e },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-pager'
   */
  static define(tagName='cork-pager'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}

/**
 * @typedef {Object} PagerItem
 * @description An item in a cork-pager, from makePagerItems.
 * @property {String} type - 'page', 'ellipses', 'prev' or 'next'.
 * @property {Number|null} page - The page the item goes to. For ellipses, the hidden page next to the shown ones, or null with staticEllipses.
 * @property {Boolean} current - Whether it's the current page's item. Only ever true for a 'page' item.
 * @property {String|null} link - The link to the item's page (see getLink), or null if the pager has no way to make links, or for ellipses with staticEllipses.
 */
