import { LitElement } from 'lit';
import { render, styles } from "./cork-nav-lite.tpl.js";

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A single-level main menu, shown inline in the cork-header bar. For sites with only a few top-level links.
 * Add it as a child of the cork-header element. The header shows it on larger screens, in place of the menu tray toggle.
 * Smaller screens use the menu tray, so the site also needs a cork-primary-nav.
 * The links can be written in the element, or copied from the header's cork-primary-nav with copyFromPrimaryNav, so they're only written once.
 * Only top-level items are shown: sub menus and fields are ignored.
 * @property {String} headerComponentLabel - Label for the menu, used as the nav's aria-label. Default: 'Main Menu'. Attribute: header-component-label.
 * @property {Boolean} copyFromPrimaryNav - Copies the top-level items of the cork-primary-nav in the same cork-header, instead of reading the element's own links.
 * The cork-header does the copying, and copies again when the primary nav's items change. Attribute: copy-from-primary-nav.
 * @property {Number} primaryNavMaxItems - With copyFromPrimaryNav, the number of items to copy, from the start. Default: all. Attribute: primary-nav-max-items.
 * @slot - Links: a/button elements, or a ul/ol of li elements. Not an actual slot, but rather parsed and rendered into the shadow DOM. Ignored with copyFromPrimaryNav.
 * @example
 * import '@ucd-lib/cork-theme/elements/cork-nav-lite';
 * // or the class only, without registering the element:
 * // import CorkNavLite from '@ucd-lib/cork-theme/elements/cork-nav-lite/cork-nav-lite.js';
 *
 * <cork-header>
 *   <cork-nav-lite>
 *     <a href="/services">Services</a>
 *     <a href="/collections">Collections</a>
 *     <button>Chat with a librarian</button>
 *   </cork-nav-lite>
 *   <cork-primary-nav>…</cork-primary-nav>
 * </cork-header>
 *
 * <!-- or copy the first three items of the primary nav -->
 * <cork-header>
 *   <cork-nav-lite copy-from-primary-nav primary-nav-max-items="3"></cork-nav-lite>
 *   <cork-primary-nav>…</cork-primary-nav>
 * </cork-header>
 */
export default class CorkNavLite extends LitElement {

  static get properties() {
    return {
      headerComponentLabel: { type: String, attribute: 'header-component-label' },
      copyFromPrimaryNav: { type: Boolean, attribute: 'copy-from-primary-nav' },
      primaryNavMaxItems: { type: Number, attribute: 'primary-nav-max-items' }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.headerComponentLabel = 'Main Menu';

    this.ctl = {
      nav: new NavController(this, {
        noParseHostProperty: 'copyFromPrimaryNav'
      })
    }
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-nav-lite'
   */
  static define(tagName='cork-nav-lite'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}