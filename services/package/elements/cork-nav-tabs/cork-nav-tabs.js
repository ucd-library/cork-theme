import { LitElement } from 'lit';
import { render, styles } from "./cork-nav-tabs.tpl.js";

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A row of navigation tabs, for moving between related pages or views, e.g. the sections of a record.
 * The tab bar only: content below it is up to the page.
 * Only top-level items are shown: sub menus and fields are ignored.
 * The tab bar keeps its own light background on dark and category brand sections, as campus's does.
 * @property {String} navAriaLabel - Label for the nav. Default: 'Tabs'. Attribute: nav-aria-label.
 * @property {Boolean} secondary - Uses campus's secondary style: a transparent bar with a bottom border and smaller text. Attribute: secondary.
 * @slot - Tabs: a/button elements, or a ul/ol of li elements. Not an actual slot, but rather parsed and rendered into the shadow DOM by {@link NavController}.
 * See its examples for the markup formats. Mark the current tab with data-active, on its li or its link/button:
 * it's highlighted, and gets aria-current ('page' on links, 'true' on buttons).
 * Move data-active to change tabs, e.g. on a route change.
 * @event cork-nav-item-click - Fired when a rendered link or button is clicked, with the clicked item in detail.navItem. See {@link NavController}.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-nav-tabs';
 *
 * // or the class only, without registering the element:
 * import CorkNavTabs from '@ucd-lib/cork-theme/elements/cork-nav-tabs/cork-nav-tabs.js';
 *
 * @example <caption>Links</caption>
 * <cork-nav-tabs>
 *   <ul>
 *     <li data-active><a href="/record/1">Overview</a></li>
 *     <li><a href="/record/1/holdings">Holdings</a></li>
 *     <li><a href="/record/1/citations">Citations</a></li>
 *   </ul>
 * </cork-nav-tabs>
 *
 * @example <caption>Buttons</caption>
 * <cork-nav-tabs nav-aria-label="Views">
 *   <button data-active>List</button>
 *   <button>Grid</button>
 * </cork-nav-tabs>
 *
 * @example <caption>Handling button clicks</caption>
 * tabs.addEventListener('cork-nav-item-click', e => {
 *   tabs.querySelector('[data-active]')?.removeAttribute('data-active');
 *   e.detail.navItem.ele.setAttribute('data-active', '');
 * });
 *
 * @example <caption>Secondary</caption>
 * <cork-nav-tabs secondary>
 *   <a href="/record/1" data-active>Overview</a>
 *   <a href="/record/1/holdings">Holdings</a>
 * </cork-nav-tabs>
 */
export default class CorkNavTabs extends LitElement {

  static get properties() {
    return {
      navAriaLabel: { type: String, attribute: 'nav-aria-label' },
      secondary: { type: Boolean }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.navAriaLabel = 'Tabs';
    this.secondary = false;

    this.ctl = {
      nav: new NavController(this)
    }
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-nav-tabs'
   */
  static define(tagName='cork-nav-tabs'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
