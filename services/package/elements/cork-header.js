import { LitElement } from 'lit';
import {render, styles} from "./cork-header.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @typedef {Object} SlottedComponent
 * @property {String} name - The slot's name, as used in the slot attribute (e.g. 'primary-nav').
 * @property {HTMLElement|null} ele - The light DOM child currently assigned to the slot, or null if there is none.
 * @property {String} corkComponentName - Tag name of the cork element that is assigned to this slot automatically (e.g. 'cork-primary-nav').
 * @property {String} [navTrayName] - Name of the nav tray that this component toggles, if any (e.g. 'menu').
 */

/**
 * @description The primary site header component that accepts various slotted header components
 * @property {String} backgroundImageUrl - Overrides the header bar's default background image. Attribute: background-image-url.
 * @slot primary-nav - Main menu. A child cork-primary-nav is assigned here automatically.
 * @slot search - Search form. A child cork-search is assigned here automatically.
 * @slot quick-links - Quick links section. A child cork-quick-links is assigned here automatically.
 * @slot branding-bar - Branding bar. A child cork-branding-bar is assigned here automatically.
 * @example
 * import '@ucd-lib/cork-theme/elements/cork-header.js';
 * <cork-header></cork-header>
 */
export default class CorkHeader extends LitElement {

  static get properties() {
    return {
      backgroundImageUrl: { type: String, attribute: 'background-image-url' },
      _slottedComponents: { type: Object }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.backgroundImageUrl = '';
    this.render = render.bind(this);

    this.ctl = {
      mutationObserver: new MutationObserverController(this)
    }

    /**
     * @description The header's named slots, and the element currently assigned to each. Kept current by _onChildListMutation.
     * @type {Object}
     * @property {SlottedComponent} primaryNav - The primary-nav slot, for a cork-primary-nav.
     * @property {SlottedComponent} search - The search slot, for a cork-search.
     * @property {SlottedComponent} quickLinks - The quick-links slot, for a cork-quick-links.
     * @property {SlottedComponent} brandingBar - The branding-bar slot, for a cork-branding-bar.
     */
    this._slottedComponents = {
      primaryNav: {
        name: 'primary-nav', 
        ele: null, 
        corkComponentName: 'cork-primary-nav',
        navTrayName: 'menu'
      },
      search: {
        name: 'search', 
        ele: null, 
        corkComponentName: 'cork-search',
        navTrayName: 'search'
      },
      quickLinks: {
        name: 'quick-links', 
        ele: null, 
        corkComponentName: 'cork-quick-links',
        navTrayName: 'quicklinks'
      },
      brandingBar: {
        name: 'branding-bar', 
        ele: null, 
        corkComponentName: 'cork-branding-bar' 
      }
    };
  }

  /**
   * @description Callback for MutationObserverController when the child list of the header changes.
   * Finds or assigns the header's direct children to the appropriate slots.
   */
  _onChildListMutation() {

    let requestUpdate = false;
    for (const key in this._slottedComponents) {
      const slot = this._slottedComponents[key];
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
    if (requestUpdate) this.requestUpdate();
  }

  _onToggleButtonClick(component) {
    console.log('toggle button clicked for', component);
  }

}

if ( !customElements.get('cork-header') ) { 
  customElements.define('cork-header', CorkHeader);
} 