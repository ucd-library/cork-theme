import { LitElement } from 'lit';
import { render, styles } from "./cork-quick-links.tpl.js";

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A quick links menu component: a short list of links/buttons outside of the main navigation.
 * Add it as a child of the {@link cork-header} element.
 * @property {String} headerComponentLabel - Label for the menu, e.g. in the header's nav tray. Default: 'Quick Links'. Attribute: header-component-label.
 * @property {Boolean} highlight - Shows the first three links as large highlighted buttons. Attribute: highlight.
 * @property {Boolean} twoColumns - Shows the links in two columns, when there's room. Attribute: two-columns.
 * @property {Boolean} homeSite - Adds the ucdavis home site's icons to the first three links. Attribute: home-site.
 * @slot - Links: a/button elements, or a ul/ol of li elements. Not an actual slot, but rather parsed and rendered into the shadow DOM by {@link NavController}. See its examples for the markup formats.
 * @event cork-nav-item-click - Fired when a rendered link or button is clicked, with the clicked item in detail.navItem. See {@link NavController}.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-quick-links';
 *
 * // or the class only, without registering the element:
 * import CorkQuickLinks from '@ucd-lib/cork-theme/elements/cork-quick-links/cork-quick-links.js';
 *
 * @example <caption>Use</caption>
 * <cork-quick-links highlight two-columns>
 *   <a href="/hours">Hours</a>
 *   <a href="/give">Give</a>
 *   <a href="/contact">Contact</a>
 *   <button>Chat with a librarian</button>
 * </cork-quick-links>
 */
export default class CorkQuickLinks extends LitElement {

  static get properties() {
    return {
      headerComponentLabel: { type: String, attribute: 'header-component-label' },
      highlight: { type: Boolean},
      twoColumns: { type: Boolean, attribute: 'two-columns' },
      homeSite: { type: Boolean, attribute: 'home-site' },
      _modifiers: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  /**
   * @description Lit shadow root options. delegatesFocus forwards focus() on the element to its first focusable control,
   * e.g. when cork-header opens its nav tray.
   */
  static get shadowRootOptions() {
    return { ...LitElement.shadowRootOptions, delegatesFocus: true };
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.headerComponentLabel = 'Quick Links';

    this.ctl = {
      nav: new NavController(this)
    }

    this._modifiers = {};
    this.highlight = false;
    this.twoColumns = false;
    this.homeSite = false;
  }

  /**
   * @description Standard Lit lifecycle method.
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props) {
    const modifiers = {
      highlight: 'highlight',
      twoColumns: 'two-columns',
      homeSite: 'home-site'
    }
    for (const [prop, modifier] of Object.entries(modifiers)) {
      if (props.has(prop)) {
        this._modifiers = {
          ...this._modifiers,
          [modifier]: this[prop]
        }
      }
    }
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-quick-links'
   */
  static define(tagName='cork-quick-links'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
