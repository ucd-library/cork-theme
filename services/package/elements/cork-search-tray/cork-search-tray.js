import { LitElement } from 'lit';
import { render, styles } from "./cork-search-tray.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description Lays out the cork-header's search tray when it has more than a search form: a cork-search-form and a cork-search-common.
 *
 * Add it as a child of the cork-header element. With only a form, put the cork-search-form directly in the header instead.
 *
 * - Its children are assigned to its slots automatically by tag name, or by their slot attribute.
 * - Opening the tray focuses the form.
 * - Closing the tray calls onNavTrayHide() on each child that has it.
 * @property {String} headerComponentLabel - Label for the tray, e.g. in the header's nav tray bar. Default: 'Search'. Attribute: header-component-label.
 * @slot form - Search form. A child {@link cork-search-form} is assigned here automatically.
 * @slot common - Common searches, shown below the form. A child {@link cork-search-common} is assigned here automatically.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-search-tray';
 *
 * // or the class only, without registering the element:
 * import CorkSearchTray from '@ucd-lib/cork-theme/elements/cork-search-tray/cork-search-tray.js';
 *
 * @example <caption>Use</caption>
 * <cork-header>
 *   <cork-search-tray>
 *     <cork-search-form>
 *       <button name="news">News</button>
 *     </cork-search-form>
 *     <cork-search-common>
 *       <a href="/hours">Hours</a>
 *     </cork-search-common>
 *   </cork-search-tray>
 * </cork-header>
 */
export default class CorkSearchTray extends LitElement {

  static get properties() {
    return {
      headerComponentLabel: { type: String, attribute: 'header-component-label' },
      _slottedComponents: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.headerComponentLabel = 'Search';

    /**
     * @description The tray's named slots, and the element currently assigned to each. Kept current by _onChildListMutation.
     * @type {Object}
     * @property {Object} form - The form slot, for a cork-search-form.
     * @property {Object} common - The common slot, for a cork-search-common.
     */
    this._slottedComponents = {
      form: {
        name: 'form',
        ele: null,
        corkComponentName: 'cork-search-form'
      },
      common: {
        name: 'common',
        ele: null,
        corkComponentName: 'cork-search-common'
      }
    };

    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true}, this._onChildListMutation)
    }
  }

  /**
   * @description Callback for MutationObserverController when the tray's child list changes.
   * Finds or assigns the tray's direct children to the appropriate slots.
   */
  _onChildListMutation() {
    let requestUpdate = false;
    for ( const slot of Object.values(this._slottedComponents) ) {
      let ele = this.querySelector(`:scope > [slot="${slot.name}"]`);
      if ( !ele ) {
        ele = this.querySelector(`:scope > ${slot.corkComponentName}:not([slot])`);
        if ( ele ) ele.setAttribute('slot', slot.name);
      }
      if ( ele !== slot.ele ) {
        slot.ele = ele;
        requestUpdate = true;
      }
    }
    if ( requestUpdate ) this.requestUpdate();
  }

  /**
   * @description Focuses the form, or else the common searches. Called by cork-header when it opens the tray.
   * The children are slotted, so delegatesFocus on this element wouldn't reliably reach their controls.
   * @param {Object} opts - Focus options, passed on to the child's focus().
   */
  focus(opts){
    const ele = this._slottedComponents.form.ele || this._slottedComponents.common.ele;
    if ( ele ) {
      ele.focus(opts);
    } else {
      super.focus(opts);
    }
  }

  /**
   * @description Called by cork-header when its nav tray hides this element. Passes the call on to each child that has the method,
   * e.g. so the form clears its input.
   */
  onNavTrayHide(){
    Object.values(this._slottedComponents).forEach(slot => slot.ele?.onNavTrayHide?.());
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-search-tray'
   */
  static define(tagName='cork-search-tray'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
