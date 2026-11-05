import { LitElement } from 'lit';
import { render, styles } from "./cork-primary-nav.tpl.js";

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description The site's main menu. Add it as a child of the cork-header element, which opens it in its nav tray.
 * In progress.
 * @property {String} headerComponentLabel - Label for the menu, e.g. in the header's nav tray. Default: 'Main Menu'. Attribute: header-component-label.
 * @property {Number[]} focusedNavItem - navPosition of the focused item, e.g. [1, 0]. Attribute: focused-nav-item, comma-separated (e.g. "1,0").
 * @slot - Menu: a ul/ol of li elements, nested for sub menus. Not an actual slot, but rather parsed and rendered into the shadow DOM.
 * @example
 * import '@ucd-lib/cork-theme/elements/cork-primary-nav';
 * // or the class only, without registering the element:
 * // import CorkPrimaryNav from '@ucd-lib/cork-theme/elements/cork-primary-nav/cork-primary-nav.js';
 *
 * <cork-primary-nav>
 *   <ul>
 *     <li>
 *       <a href="/services">Services</a>
 *       <ul>
 *         <li><a href="/services/borrow">Borrowing</a></li>
 *       </ul>
 *     </li>
 *   </ul>
 * </cork-primary-nav>
 */
export default class CorkPrimaryNav extends LitElement {

  static get properties() {
    return {
      headerComponentLabel: { type: String, attribute: 'header-component-label' },
      focusedNavItem: { 
        type: Array, 
        attribute: 'focused-nav-item',
        converter: {
          fromAttribute: (value) => {
            try {
              return value ? value.split(',').map((v) => parseInt(v)).filter((v) => !isNaN(v)) : [];
            } catch (e) {
              return [];
            }
          },
          toAttribute: (value) => {
            try {
              return value ? value.join(',') : '';
            } catch (e) {
              return '';
            }
          }
        }
      },
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.headerComponentLabel = 'Main Menu';
    this.focusedNavItem = [];

    this.ctl = {
      nav: new NavController(this)
    }
  }

  /**
   * @description Registers the element as a custom element, unless the tag name is already registered.
   * A class can only be registered once, under one tag name. To register it under another name as well, subclass it first,
   * e.g. class MyElement extends CorkPrimaryNav {}; MyElement.define('my-element');
   * @param {String} tagName - Tag name to register. Default: 'cork-primary-nav'
   */
  static define(tagName='cork-primary-nav'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
