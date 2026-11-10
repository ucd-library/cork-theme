import MutationObserverController from './MutationObserverController.js';

import { renderItem, renderDrillDown, drillDownStyles } from './NavController.tpl.js';

/**
 * @typedef {Object} NavItem
 * @description Used by the NavController to represent a navigation item, which may be a link, button, or title-only item, and may have sub items.
 * @property {String} title - The item's text: from its link/button, its own text, or deprecated link-text attribute.
 * @property {String|null} href - The href as written in the markup, or null.
 * @property {String|null} target - The target attribute, or null.
 * @property {Boolean} disabled - Whether the link/button has the disabled attribute.
 * @property {String|null} ariaLabel - The aria-label attribute of the element that supplied the title (the link/button, li, or deprecated list), or null.
 * @property {Object} fields - Text of each child element marked with the field attribute, keyed by its value (e.g. description).
 * @property {NavItem[]} subItems - Child items.
 * @property {Number[]} navPosition - Index at each level of the tree, from the top. e.g. [0, 2] is the third sub item of the first item.
 * @property {HTMLElement|null} ele - The light DOM link/button that supplied the title, or null.
 * @property {Function} click - For button items: passes a click through to the light DOM button, so its listeners run. Use as the shadow DOM button's click listener, e.g. @click=${item.click}.
 *
 * Does nothing for other items: links rely on their shadow DOM href, so listeners on a light DOM link don't run.
 * @property {Function} render - Renders the item's own link/button (not its sub items) for the host's shadow DOM, e.g. ${item.render({classes: 'menu__link'})}.
 *
 * Takes an opts object, where opts.classes is a class string or a classMap object, or just a class string, e.g. ${item.render('menu__link')}.
 * @property {Function} matchesCoordinates - Takes a navPosition (e.g. [1, 0, 2]). Returns true if the item is at exactly that position.
 * @property {Function} containsCoordinates - Takes a navPosition. Returns true if the item is at that position or is one of its ancestors, e.g. [1] and [1, 0] contain [1, 0, 2].
 * @property {Object} renderedEles - The item's elements in the host's shadow DOM, set when they render. Empty until then.
 * @property {HTMLElement} [renderedEles.item] - The link, button, or span rendered by item.render.
 * @property {HTMLElement} [renderedEles.linkToSubmenu] - Drill-down only: the toggle button that opens the item's submenu.
 * @property {HTMLElement} [renderedEles.submenu] - Drill-down only: the item's submenu.
 * @property {Function} focus - Focuses one of the item's renderedEles. Takes an opts object, where opts.key is the renderedEles key (default 'item'),
 * or just the key, e.g. item.focus('linkToSubmenu'). 
 */

/**
 * @class NavController
 * @classdesc Lit controller that parses menu markup in the host's light DOM into navItems, for the host element to render in its shadow DOM.
 * See examples for supported light DOM markup formats.
 *
 * @property {LitElement} host - 'this' from a Lit element
 * @property {String} fieldAttribute - Attribute that marks a field element. Default: 'data-nav'
 * @property {NavItem[]} navItems - The parsed items
 * 
 * @event cork-nav-items-update - Fired when the navItems are parsed, e.g. on host connection or light DOM mutation. Not fired by copyNavItems.
 *
 * @example <caption>Instantiation</caption>
 * import { NavController } from '@ucd-lib/cork-theme/utils/controllers';
 *
 * // in the host element's constructor
 * this.ctl = { nav: new NavController(this) };
 * // or with a different field attribute
 * this.ctl = { nav: new NavController(this, { fieldAttribute: 'data-cork-nav' }) };
 *
 * @example <caption>Rendering</caption>
 * <!-- in your element template: each item's own link/button -->
 * ${this.ctl.nav.navItems.map(item => item.render({ classes: 'menu__link' }))}
 *
 * <!-- or assign classes per item type -->
 * ${this.ctl.nav.navItems.map(item => item.render({ typeClasses: { button: 'menu__button', a: 'menu__link', span: 'menu__nolink' } }))}
 *
 * <!-- or the whole menu as a drill-down, with ...NavController.drillDownStyles in the element's styles -->
 * ${this.ctl.nav.renderDrillDown()}
 *
 * @example <caption>Light DOM markup</caption>
 * ```html
 * <!-- flat: a series of a/button elements, each a title-only item -->
 * <my-nav>
 *   <a href="/hours">Hours</a>
 *   <button>Chat with a librarian</button>
 * </my-nav>
 *
 * <!-- list: li items, nested for sub menus, with fields marked by fieldAttribute -->
 * <my-nav>
 *   <ul>
 *     <li>
 *       <a href="/services">Services</a>
 *       <span data-nav="description">Borrowing, printing, and research help</span>
 *       <ul>
 *         <li><a href="/services/borrow">Borrowing</a></li>
 *       </ul>
 *     </li>
 *     <li>
 *       Collections
 *       <ul>
 *         <li><a href="/collections/special">Special Collections</a></li>
 *       </ul>
 *     </li>
 *   </ul>
 * </my-nav>
 * ```
 */
export default class NavController {

  /**
   * @param {LitElement} host - 'this' from a Lit element
   * @param {Object} opts - Options.
   * @param {String} opts.fieldAttribute - Attribute that marks a field element. Default: 'data-nav'
   * @param {String} opts.hostFocusedCoordinatesProperty - Property name for the host's focused nav item coordinates. Default: 'focusedNavItem'
   * @param {Boolean} opts.closeSubmenusOnEscape - Drill-down: the Escape key closes the submenu that has focus (or all submenus, if none has focus). Default: false
   * @param {Boolean} opts.setChildHeight - Drill-down: on narrow screens, sizes the expanded submenus to the deepest one, since submenus from level 3 down are absolutely positioned. Default: false
   * @param {String} opts.noParseHostProperty - If set, the host's property of this name is checked before parsing the light DOM. If truthy, parsing is skipped. Default: undefined
   */
  constructor(host, opts={}){
    (this.host = host).addController(this);
    this.fieldAttribute = opts.fieldAttribute || 'data-nav';
    this.navItems = [];
    this.hostFocusedCoordinatesProperty = opts.hostFocusedCoordinatesProperty || 'focusedNavItem';
    this.noParseHostProperty = opts.noParseHostProperty;
    this.closeSubmenusOnEscape = opts.closeSubmenusOnEscape || false;
    this.setChildHeight = opts.setChildHeight || false;
    this._onKeydown = this._onKeydown.bind(this);

    this.mutationObserver = new MutationObserverController(
      this.host,
      {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [this.fieldAttribute, 'href', 'target', 'disabled', 'link-text', 'aria-label']
      },
      this._onMutation.bind(this)
    );

    this.renderDrillDown = renderDrillDown.bind(this);
  }

  static get drillDownStyles() {
    return drillDownStyles();
  }

  /**
   * @description Lit controller lifecycle method. Adds the Escape key listener, if opts.closeSubmenusOnEscape is set.
   */
  hostConnected(){
    this.host._corkNavController = this;
    if ( this.closeSubmenusOnEscape ) this.host.addEventListener('keydown', this._onKeydown);
  }

  /**
   * @description Lit controller lifecycle method. Removes the Escape key listener.
   */
  hostDisconnected(){
    this.host.removeEventListener('keydown', this._onKeydown);
  }

  /**
   * @description Lit controller lifecycle method.
   */
  hostUpdated(){
    this.setNavDrillChildHeight();

  }

  /**
   * @description Sets --nav-drill-child-height CSS variable for drill down navigation.
   * Needed to ensure that level 3+ submenus are properly sized on narrow screens.
   */
  setNavDrillChildHeight(){
    if ( !this.setChildHeight || !this._drillDownInnerEle ) return;
    const coordinates = this.host[this.hostFocusedCoordinatesProperty] || [];
    const coordinatesKey = coordinates.join(',');
    if ( coordinatesKey === this._childHeightCoordinates ) return;
    this._childHeightCoordinates = coordinatesKey;

    // Reset first, so the submenu is measured at its natural height
    const inner = this._drillDownInnerEle;
    inner.style.setProperty('--nav-drill-child-height', 'auto');
    if ( this.host.offsetWidth > 999 ) return;

    // A level 2 submenu that is still opening measures 0, so stays auto
    const height = this.getNavItem(coordinates)?.renderedEles.submenu?.offsetHeight || 0;
    if ( height > 0 ) inner.style.setProperty('--nav-drill-child-height', `${height}px`);
  }

  /**
   * @description Keydown listener on the host, added if opts.closeSubmenusOnEscape is set.
   */
  _onKeydown(e){
    this._closeDrillDownOnEscape(e);
  }

  /**
   * @description On Escape, closes the expanded submenu that has focus (moving up a level), or all submenus if focus is outside them.
   * Prevents the default, so the Escape doesn't also close a dialog the host is in.
   * @param {KeyboardEvent} e - The keydown event.
   * @returns 
   */
  _closeDrillDownOnEscape(e){
    if ( e.key !== 'Escape' ) return;
    const coordinates = this.host[this.hostFocusedCoordinatesProperty] || [];
    if ( !coordinates.length ) return;
    e.preventDefault();

    // Walk up the expanded branch, from the deepest submenu, to find the one that has focus
    const activeEle = this.host.renderRoot.activeElement;
    for ( let i = coordinates.length; i > 0; i-- ) {
      const item = this.getNavItem(coordinates.slice(0, i));
      if ( item?.renderedEles.submenu?.contains(activeEle) ) {
        this._onDrillDownToggleClick(item, true);
        return;
      }
    }
    this.host[this.hostFocusedCoordinatesProperty] = [];
    this.host.requestUpdate();
  }

  /**
   * @description Callback for MutationObserverController. Also runs when the host connects.
   * Re-parses the light DOM, requests a host update, and fires cork-nav-items-update.
   * Does nothing if the host property named by opts.noParseHostProperty is truthy.
   */
  _onMutation(){
    if ( this.noParseHostProperty && this.host[this.noParseHostProperty] ) return;
    this.navItems = this.parse();
    this.host.requestUpdate();
    const detail = { navItems: this.navItems };
    if ( this.host[this.hostFocusedCoordinatesProperty] ) {
      detail.focusedCoordinates = this.host[this.hostFocusedCoordinatesProperty];
    }
    this.host.dispatchEvent(new CustomEvent('cork-nav-items-update', { detail, bubbles: true, composed: true }));
  }

  /**
   * @description Parses the host's light DOM into nav items.
   * @returns {NavItem[]}
   */
  parse(){
    const items = this._parseHostChildren();
    this._setNavPositions(items);
    return items;
  }

  /**
   * @description Returns the item at a position in the tree.
   * @param {Number[]} navPosition - Index at each level, e.g. [0, 2].
   * @returns {NavItem|undefined}
   */
  getNavItem(navPosition=[]){
    let item;
    let items = this.navItems;
    for ( const i of navPosition ) {
      item = items?.[i];
      items = item?.subItems;
    }
    return item;
  }

  /**
   * @description Parses the host's direct children.
   * A list without link-text is a wrapper: its children become top-level items.
   * @returns {NavItem[]}
   */
  _parseHostChildren(){
    const items = [];
    for ( const child of Array.from(this.host.children) ) {
      if ( child.matches('a, button') ) {
        items.push(this._parseLink(child));
      } else if ( child.matches('li') ) {
        items.push(this._parseListItem(child));
      } else if ( this._isList(child) ) {
        if ( child.hasAttribute('link-text') ) {
          items.push(this._parseDeprecatedList(child));
        } else {
          items.push(...this._parseListChildren(child));
        }
      }
    }
    return items.filter(item => item.title);
  }

  /**
   * @description Parses the children of a ul/ol: li elements, and deprecated link-text attributes.
   * @param {HTMLElement} list - A ul/ol element.
   * @returns {NavItem[]}
   */
  _parseListChildren(list){
    const items = [];
    for ( const child of Array.from(list.children) ) {
      if ( child.matches('li') ) {
        items.push(this._parseListItem(child));
      } else if ( this._isList(child) && child.hasAttribute('link-text') ) {
        items.push(this._parseDeprecatedList(child));
      }
    }
    return items.filter(item => item.title);
  }

  /**
   * @description Parses a li. Only its direct children are read:
   * marked elements become fields, nested lists become sub items, and the rest gives the title.
   * @param {HTMLElement} li - A li element.
   * @returns {NavItem}
   */
  _parseListItem(li){
    const fields = {};
    const subItems = [];
    for ( const child of Array.from(li.children) ) {
      if ( this._isField(child) ) {
        fields[child.getAttribute(this.fieldAttribute)] = this._cleanText(child.textContent);
      } else if ( this._isList(child) ) {
        subItems.push(...this._parseListChildren(child));
      }
    }

    const titleEle = this._getTitleElement(li);
    if ( titleEle ) {
      return this._makeItem({ ...this._getLinkProperties(titleEle), fields, subItems });
    }
    return this._makeItem({ title: this._getOwnText(li), ariaLabel: li.getAttribute('aria-label'), fields, subItems });
  }

  /**
   * @description Parses the deprecated list format, whose title and href are attributes on the list itself.
   * @param {HTMLElement} list - A ul/ol element with a link-text attribute.
   * @returns {NavItem}
   */
  _parseDeprecatedList(list){
    return this._makeItem({
      title: this._cleanText(list.getAttribute('link-text')),
      href: list.getAttribute('href'),
      ariaLabel: list.getAttribute('aria-label'),
      subItems: this._parseListChildren(list)
    });
  }

  /**
   * @description Parses a link/button into a title-only item.
   * @param {HTMLElement} ele - An a/button element.
   * @returns {NavItem}
   */
  _parseLink(ele){
    return this._makeItem(this._getLinkProperties(ele));
  }

  /**
   * @description Reads the item properties that come from a link/button.
   * @param {HTMLElement} ele - An a/button element.
   * @returns {Object} title, href, target, disabled, ariaLabel and ele.
   */
  _getLinkProperties(ele){
    return {
      title: this._cleanText(ele.textContent),
      href: ele.getAttribute('href'),
      target: ele.getAttribute('target'),
      disabled: ele.hasAttribute('disabled'),
      ariaLabel: ele.getAttribute('aria-label'),
      ele
    };
  }

  /**
   * @description Finds the element that supplies a li's title: its first direct child a/button that isn't a field.
   * @param {HTMLElement} li - A li element.
   * @returns {HTMLElement|undefined}
   */
  _getTitleElement(li){
    return Array.from(li.children).find(child => child.matches('a, button') && !this._isField(child));
  }

  /**
   * @description Gets a li's own text, leaving out fields and nested lists.
   * @param {HTMLElement} li - A li element.
   * @returns {String}
   */
  _getOwnText(li){
    let text = '';
    for ( const node of Array.from(li.childNodes) ) {
      if ( node.nodeType === Node.TEXT_NODE ) {
        text += ` ${node.nodeValue}`;
      } else if ( node.nodeType === Node.ELEMENT_NODE && !this._isField(node) && !this._isList(node) ) {
        text += ` ${node.textContent}`;
      }
    }
    return this._cleanText(text);
  }

  /**
   * @description Sets navPosition on each item and its sub items.
   * @param {NavItem[]} items - Items at one level of the tree.
   * @param {Number[]} parentPosition - navPosition of their parent. Empty for the top level.
   */
  _setNavPositions(items, parentPosition=[]){
    items.forEach((item, i) => {
      item.navPosition = [...parentPosition, i];
      this._setNavPositions(item.subItems, item.navPosition);
    });
  }

  /**
   * @description Makes an item with defaults for any missing properties, and its functions.
   * @param {Object} props - Properties of the item.
   * @returns {NavItem}
   */
  _makeItem(props={}){
    const item = {
      title: '',
      href: null,
      target: null,
      disabled: false,
      ariaLabel: null,
      fields: {},
      subItems: [],
      navPosition: [],
      ele: null,
      renderedEles: {},
      ...props
    };
    // Passes a click through to the light DOM button. Links aren't passed through, so clicks keep their native behavior
    item.click = () => {
      if ( !item.ele?.matches('button') ) return;
      item.ele.click();
    };
    item.render = (opts={}) => renderItem.call(this, item, opts);
    item.matchesCoordinates = (coordinates) => this._matchesCoordinates(item, coordinates);
    item.containsCoordinates = (coordinates) => this._containsCoordinates(item, coordinates);
    item.focus = (opts={}) => this._focusItem(item, opts);
    return item;
  }

  /**
   * @description Copies a nav item, e.g. from another controller, so the copy shares no references with it, except ele (the light DOM link/button).
   * @param {NavItem} navItem - The item to copy.
   * @param {Object} opts - Options.
   * @param {Boolean} opts.copySubItems - Also copy the sub items, recursively. Otherwise the copy has none. Default: false
   * @returns {NavItem}
   */
  _copyNavItem(navItem, opts={}){
    return this._makeItem({
      title: navItem.title,
      href: navItem.href,
      target: navItem.target,
      disabled: navItem.disabled,
      ariaLabel: navItem.ariaLabel,
      fields: { ...navItem.fields },
      subItems: opts.copySubItems ? navItem.subItems.map(subItem => this._copyNavItem(subItem, opts)) : [],
      navPosition: [...navItem.navPosition],
      ele: navItem.ele
    });
  }

  /**
   * @description Replaces navItems with copies of another controller's items, and requests a host update.
   *
   * - The copies share no references with the originals, except ele, so clicks still pass through to the original light DOM buttons.
   * - Use with opts.noParseHostProperty, so the host's own light DOM doesn't overwrite the copies.
   * @param {NavItem[]} navItems - The items to copy, e.g. otherController.navItems.
   * @param {Object} opts - Options.
   * @param {Number} opts.sliceEnd - If set, only copies the first sliceEnd items.
   * @param {Boolean} opts.copySubItems - Also copy the sub items, recursively. Otherwise the copies have none. Default: false
   * @returns {void}
   */
  copyNavItems(navItems, opts={}){
    let copies = navItems.map(navItem => this._copyNavItem(navItem, opts));
    if ( opts.sliceEnd ) {
      copies = copies.slice(0, opts.sliceEnd);
    }
    this.navItems = copies;
    this.host.requestUpdate();
  }

  /**
   * @description Focuses one of an item's rendered elements. Called by item.focus.
   * @param {NavItem} item - The item.
   * @param {Object|String} opts - Options. A string is treated as opts.key.
   * @param {String} opts.key - Key of the element in item.renderedEles. Default: 'item'
   * @returns {Boolean} True if the element took focus. Spans, disabled buttons, and unrendered elements don't.
   */
  _focusItem(item, opts={}){
    if ( typeof opts === 'string' ) opts = { key: opts };
    const ele = item.renderedEles[opts.key || 'item'];
    if ( !ele ) return false;
    ele.focus({ preventScroll: true });
    return this.host.renderRoot.activeElement === ele;
  }

  /**
   * @description Whether an item is at the given coordinates. Called by item.matchesCoordinates.
   * @param {NavItem} item - The item.
   * @param {Number[]} coordinates - A navPosition, e.g. [1, 0, 2].
   * @returns {Boolean}
   */
  _matchesCoordinates(item, coordinates=[]){
    return coordinates.length === item.navPosition.length && this._containsCoordinates(item, coordinates);
  }

  /**
   * @description Whether an item is at the given coordinates, or is an ancestor of the item there.
   * e.g. for highlighting the branch that leads to the focused item. Called by item.containsCoordinates.
   * @param {NavItem} item - The item.
   * @param {Number[]} coordinates - A navPosition, e.g. [1, 0, 2].
   * @returns {Boolean}
   */
  _containsCoordinates(item, coordinates=[]){
    return coordinates.length >= item.navPosition.length && item.navPosition.every((v, i) => v === coordinates[i]);
  }

  /**
   * @description Whether an element is marked with the field attribute.
   * @param {HTMLElement} ele - An element.
   * @returns {Boolean}
   */
  _isField(ele){
    return ele.hasAttribute(this.fieldAttribute);
  }

  /**
   * @description Whether an element is a ul/ol.
   * @param {HTMLElement} ele - An element.
   * @returns {Boolean}
   */
  _isList(ele){
    return ele.matches('ul, ol');
  }

  /**
   * @description Collapses whitespace and trims.
   * @param {String} text - Text.
   * @returns {String}
   */
  _cleanText(text){
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * @description Handle a click on a drill-down menu toggle button.
   * @param {NavItem} item - The nav item that was clicked.
   * @param {Boolean} moveUp - If closing the item, move up the hierachy instead of closing all ancestors.
   */
  _onDrillDownToggleClick(item, moveUp=false){
    const opened = !item.containsCoordinates(this.host[this.hostFocusedCoordinatesProperty]);
    if ( !opened ) {
      if ( moveUp ) {
        this.host[this.hostFocusedCoordinatesProperty] = item.navPosition.slice(0, -1);
      } else {
        this.host[this.hostFocusedCoordinatesProperty] = [];
      }
    } else {
      this.host[this.hostFocusedCoordinatesProperty] = [...item.navPosition];
    }
    this.host.requestUpdate();

    // Scroll the other submenus back to the top. When closing, skip the submenu being closed and the one it's in, so they don't jump.
    const parentSubmenu = this.getNavItem(item.navPosition.slice(0, -1))?.renderedEles.submenu;
    const stack = [...this.navItems];
    while ( stack.length ) {
      const navItem = stack.pop();
      stack.push(...navItem.subItems);
      const submenu = navItem.renderedEles.submenu;
      if ( !submenu || (!opened && (submenu === item.renderedEles.submenu || submenu === parentSubmenu)) ) continue;
      if ( submenu.scrollTop > 0 && submenu.offsetHeight > 0 ) submenu.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this._focusAfterToggle(item, opened);
  }

  /**
   * @description Moves focus after a drill-down submenu opens or closes, once the host has rendered.
   * Opened: the item's own link/button in the submenu, or else its first focusable sub item. Closed: the item's toggle button.
   * @param {NavItem} item - The item whose submenu was toggled.
   * @param {Boolean} opened - Whether the submenu opened.
   */
  async _focusAfterToggle(item, opened){
    await this.host.updateComplete;
    // Give the submenu's transition a moment to start, as campus does
    await new Promise(resolve => setTimeout(resolve, 100));
    if ( opened ) {
      item.focus() || item.subItems.some(subItem => subItem.focus(subItem.subItems.length ? 'linkToSubmenu' : 'item'));
    } else {
      item.focus('linkToSubmenu');
    }
  }
}
