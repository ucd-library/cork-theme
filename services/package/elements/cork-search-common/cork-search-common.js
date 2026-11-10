import { LitElement } from 'lit';
import { render, styles } from "./cork-search-common.tpl.js";

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A list of common searches, shown below the search form in the cork-header's search tray.
 * Add it as a child of a cork-search-tray, alongside a cork-search-form.
 * @property {String} heading - Heading shown above the list. Default: 'Common Searches'. Attribute: heading.
 * @slot - Links: a/button elements, or a ul/ol of li elements. Not an actual slot, but rather parsed and rendered into the shadow DOM.
 * Only top-level items are shown.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-search-common';
 *
 * // or the class only, without registering the element:
 * import CorkSearchCommon from '@ucd-lib/cork-theme/elements/cork-search-common/cork-search-common.js';
 *
 * @example <caption>Use</caption>
 * <cork-search-tray>
 *   <cork-search-form></cork-search-form>
 *   <cork-search-common heading="Popular Searches">
 *     <a href="/hours">Library hours</a>
 *     <a href="/print">How do I print?</a>
 *   </cork-search-common>
 * </cork-search-tray>
 */
export default class CorkSearchCommon extends LitElement {

  static get properties() {
    return {
      heading: { type: String }
    }
  }

  static get styles() {
    return styles();
  }

  /**
   * @description Lit shadow root options. delegatesFocus forwards focus() on the element to its first focusable control,
   * e.g. when cork-search-tray is focused and has no form.
   */
  static get shadowRootOptions() {
    return { ...LitElement.shadowRootOptions, delegatesFocus: true };
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.heading = 'Common Searches';

    this.ctl = {
      nav: new NavController(this)
    }
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-search-common'
   */
  static define(tagName='cork-search-common'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
