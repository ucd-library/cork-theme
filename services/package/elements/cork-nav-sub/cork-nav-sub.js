import { LitElement } from 'lit';
import { render, styles } from "./cork-nav-sub.tpl.js";

import { NavController, HeadingController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A sub menu, rendered as a drill-down, with an optional title above it.
 * @property {String} navAriaLabel - Label for the nav. Default: the title's text, or 'Submenu' if there's no title. Attribute: nav-aria-label.
 * @property {Boolean} autoHeight - On wide screens, makes the drill-down as tall as its first menu level, following changes to that menu's size. On narrow screens its height is auto. Attribute: auto-height.
 * @property {Number[]} focusedNavItem - navPosition of the focused item, e.g. [1, 0]. Attribute: focused-nav-item, comma-separated (e.g. "1,0").
 * @slot - Title and menu. Not an actual slot, but rather parsed and rendered into the shadow DOM by controllers.
 * The title is an h1-h6, or a div/span with the data-heading attribute (optionally a level, e.g. data-heading="h2", for that level's look), optionally wrapping a link or button. See {@link HeadingController}.
 * The menu is a ul/ol of li elements, nested for sub menus. See {@link NavController} for the markup formats.
 * @event cork-nav-item-click - Fired when a rendered menu link or button is clicked, with the clicked item in detail.navItem. See {@link NavController}.
 * @event cork-heading-click - Fired when a linked title is clicked, with the title in detail.heading. See {@link HeadingController}.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-nav-sub';
 *
 * // or the class only, without registering the element:
 * import CorkNavSub from '@ucd-lib/cork-theme/elements/cork-nav-sub/cork-nav-sub.js';
 *
 * @example <caption>Use</caption>
 * <cork-nav-sub>
 *   <h2><a href="/services">Services</a></h2>
 *   <ul>
 *     <li><a href="/services/borrow">Borrowing</a></li>
 *     <li><button>Printing</button></li>
 *   </ul>
 * </cork-nav-sub>
 *
 * @example <caption>Title variations</caption>
 * <!-- unlinked -->
 * <h2>Services</h2>
 * <!-- a button, whose click listeners still run -->
 * <h2><button>Services</button></h2>
 * <!-- not an actual heading element, but styled like an h2 -->
 * <div data-heading="h2">Services</div>
 */
export default class CorkNavSub extends LitElement {

  static get properties() {
    return {
      navAriaLabel: { type: String, attribute: 'nav-aria-label' },
      autoHeight: { type: Boolean, attribute: 'auto-height' },
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
      }
    }
  }

  static get styles() {
    return styles();
  }

  static get shadowRootOptions() {
    return { ...LitElement.shadowRootOptions, delegatesFocus: true };
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.focusedNavItem = [];
    this.navAriaLabel = '';
    this.autoHeight = false;

    this.ctl = {
      nav: new NavController(this, { closeSubmenusOnEscape: true, setChildHeight: true, autoHeightHostProperty: 'autoHeight' }),
      heading: new HeadingController(this)
    }
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-nav-sub'
   */
  static define(tagName='cork-nav-sub'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}