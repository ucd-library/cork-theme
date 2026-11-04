import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import MutationObserverController from './MutationObserverController.js';

/**
 * @typedef {Object} NavItem
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
 * Does nothing for other items: links rely on their shadow DOM href, so listeners on a light DOM link don't run.
 * @property {Function} render - Renders the item's own link/button (not its sub items) for the host's shadow DOM, e.g. ${item.render({classes: 'menu__link'})}.
 * Takes an opts object, where opts.classes is a class string or a classMap object, or just a class string, e.g. ${item.render('menu__link')}. See NavController._renderItem.
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
 * @example
 * import { NavController } from '@ucd-lib/cork-theme/utils/controllers';
 *
 * // in the host element's constructor
 * this.ctl = { nav: new NavController(this) };
 * // or with a different field attribute
 * this.ctl = { nav: new NavController(this, { fieldAttribute: 'data-cork-nav' }) };
 *
 * <!-- nested lists -->
 * <my-nav>
 *   <ul>
 *     <li>
 *       <a href="/services">Services</a>
 *       <span data-nav="description">Borrowing, printing, and research help</span>
 *       <ul>
 *         <li><a href="/services/borrow">Borrowing</a></li>
 *       </ul>
 *     </li>
 *   </ul>
 * </my-nav>
 *
 * <!-- flat -->
 * <my-nav>
 *   <a href="/">Home</a>
 *   <button>Log out</button>
 * </my-nav>
 *
 */
export default class NavController {

  /**
   * @param {LitElement} host - 'this' from a Lit element
   * @param {Object} opts - Options.
   * @param {String} opts.fieldAttribute - Attribute that marks a field element. Default: 'data-nav'
   */
  constructor(host, opts={}){
    (this.host = host).addController(this);
    this.fieldAttribute = opts.fieldAttribute || 'data-nav';
    this.navItems = [];

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
  }

  /**
   * @description Callback for MutationObserverController. Also runs when the host connects.
   * Re-parses the light DOM and requests a host update.
   */
  _onMutation(){
    this.navItems = this.parse();
    this.host.requestUpdate();
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
   * @description Makes an item with defaults for any missing properties, and its click function.
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
      ...props
    };
    // Passes a click through to the light DOM button. Links aren't passed through, so clicks keep their native behavior
    item.click = () => {
      if ( !item.ele?.matches('button') ) return;
      item.ele.click();
    };
    item.render = (opts={}) => this._renderItem(item, opts);
    return item;
  }

  /**
   * @description Renders an item's own element for the host's shadow DOM: a button, anchor, or span.
   * Automatically wires up button clicks and relevant attributes. Does not render sub items.
   * Called by item.render.
   * @param {NavItem} item - The item.
   * @param {Object|String} opts - Options. A string is treated as opts.classes.
   * @param {String|Object} opts.classes - Classes to apply: a space-separated string, or a classMap object.
   * @returns {TemplateResult}
   */
  _renderItem(item, opts={}){
    if ( typeof opts === 'string' ) opts = { classes: opts };
    let classes = {};
    if ( typeof opts.classes === 'string' ) {
      classes = Object.fromEntries(opts.classes.split(/\s+/).filter(Boolean).map(c => [c, true]));
    } else if ( opts.classes ) {
      classes = opts.classes;
    }

    const ariaLabel = ifDefined(item.ariaLabel ?? undefined);

    if ( item.ele?.matches('button') ) {
      return html`
        <button
          type="button"
          class=${classMap(classes)}
          aria-label=${ariaLabel}
          ?disabled=${item.disabled}
          @click=${item.click}>${item.title}</button>`;
    }
    if ( item.href ) {
      return html`
        <a
          href=${item.href}
          target=${ifDefined(item.target ?? undefined)}
          class=${classMap(classes)}
          aria-label=${ariaLabel}>${item.title}</a>`;
    }
    return html`<span class=${classMap(classes)}>${item.title}</span>`;
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
}
