import { LitElement } from 'lit';
import {render, styles} from "./cork-header.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @typedef {Object} SlottedComponent
 * @property {String} name - The slot's name, as used in the slot attribute (e.g. 'primary-nav').
 * @property {HTMLElement|null} ele - The light DOM child currently assigned to the slot, or null if there is none.
 * @property {String} corkComponentName - Tag name of the cork element that is assigned to this slot automatically (e.g. 'cork-primary-nav').
 * @property {String} [navTrayName] - Name of the nav tray that this component toggles, if any (e.g. 'menu').
 * @property {Object} [defaultAttributes] - Default attributes to apply to the component if not found as properties or attributes on the element itself.
 * @property {String} [label] - Human readable label for the component
 * @property {Boolean} [showLabelInNavTrayBar] - Whether to show the label in the nav tray bar.
 */

/**
 * @description The primary site header component that accepts various slotted header components.
 * Its background images come from the --cork-image-* custom properties: call setImageCssCustomProperties() from
 * '@ucd-lib/cork-theme/utils/assets' to load them. Without it, the header keeps its colors and has no images.
 * The image properties below override one image for this element only.
 * When a slotted component's nav tray is hidden (closed, or switched to another tray), the header calls its onNavTrayHide() method, if it has one.
 * @property {String} backdrop - Campus's header bar variant, '1' (default) to '7'. Attribute: backdrop.
 * @property {String} backgroundImageUrl - Overrides the header bar's background image, whichever backdrop is picked. Attribute: background-image-url.
 * @property {String} navTrayMenuBackgroundImageUrl - Overrides the menu tray's background image. Attribute: nav-tray-menu-background-image-url.
 * @property {String} navTraySearchBackgroundImageUrl - Overrides the search tray's background image. Attribute: nav-tray-search-background-image-url.
 * @property {String} navTrayQuicklinksBackgroundImageUrl - Overrides the quick links tray's main (bottom right) background image. Attribute: nav-tray-quicklinks-background-image-url.
 * @property {String} navTrayQuicklinksAccentImageUrl - Overrides the quick links tray's accent (top left outline) image. Attribute: nav-tray-quicklinks-accent-image-url.
 * @property {String} selectedNavComponentName - Name of the component whose nav tray is currently open. One of the keys of _slottedComponents.
 * @slot primary-nav - Main menu. A child cork-primary-nav is assigned here automatically.
 * @slot search - Search form. A child cork-search is assigned here automatically.
 * @slot quick-links - Quick links section. A child cork-quick-links is assigned here automatically.
 * @slot branding-bar - Branding bar. A child cork-branding-bar is assigned here automatically.
 * @example
 * import '@ucd-lib/cork-theme/elements/cork-header';
 * // or the class only, without registering the element:
 * // import CorkHeader from '@ucd-lib/cork-theme/elements/cork-header/cork-header.js';
 * import { setImageCssCustomProperties } from '@ucd-lib/cork-theme/utils/assets';
 * setImageCssCustomProperties('/images/cork-theme');
 *
 * <cork-header backdrop="3">
 *   <cork-primary-nav>…</cork-primary-nav>
 *   <cork-search></cork-search>
 *   <cork-quick-links>…</cork-quick-links>
 * </cork-header>
 */
export default class CorkHeader extends LitElement {

  static get properties() {
    return {
      backdrop: { type: String },
      backgroundImageUrl: { type: String, attribute: 'background-image-url' },
      navTrayMenuBackgroundImageUrl: { type: String, attribute: 'nav-tray-menu-background-image-url' },
      navTraySearchBackgroundImageUrl: { type: String, attribute: 'nav-tray-search-background-image-url' },
      navTrayQuicklinksBackgroundImageUrl: { type: String, attribute: 'nav-tray-quicklinks-background-image-url' },
      navTrayQuicklinksAccentImageUrl: { type: String, attribute: 'nav-tray-quicklinks-accent-image-url' },
      selectedNavComponentName: { type: String},
      _selectedNavComponent: { state: true },
      _slottedComponents: { type: Object }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.backdrop = '1';
    this.backgroundImageUrl = '';
    this.navTrayMenuBackgroundImageUrl = '';
    this.navTraySearchBackgroundImageUrl = '';
    this.navTrayQuicklinksBackgroundImageUrl = '';
    this.navTrayQuicklinksAccentImageUrl = '';
    this.render = render.bind(this);

    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true}, this._onChildListMutation)
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
        navTrayName: 'menu',
        defaultAttributes: {
          label: 'Menu',
        }
      },
      search: {
        name: 'search', 
        ele: null, 
        corkComponentName: 'cork-search',
        navTrayName: 'search',
        defaultAttributes: {
          label: 'Search'
        }
      },
      quickLinks: {
        name: 'quick-links', 
        ele: null, 
        corkComponentName: 'cork-quick-links',
        navTrayName: 'quicklinks',
        defaultAttributes: {
          label: 'Quick Links',
          showLabelInNavTrayBar: true
        }
      },
      brandingBar: {
        name: 'branding-bar', 
        ele: null, 
        corkComponentName: 'cork-branding-bar',
        defaultAttributes: {
          label: 'Branding Bar'
        }
      }
    };
  }

  /**
   * @description Standard Lit lifecycle method
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props){
    if ( props.has('selectedNavComponentName') ) {
      this._onSelectedNavComponentNameChange(props.get('selectedNavComponentName'));
    }
  }

  /**
   * @description Callback for when the selectedNavComponentName property changes. Opens or closes the nav tray.
   * @param {string} prevVal - The previous value of the selectedNavComponentName property.
   * @returns {void}
   */
  _onSelectedNavComponentNameChange(prevVal){
    const selectedComponent = Object.values(this._slottedComponents).find(c => c.name === this.selectedNavComponentName);
    if ( this.selectedNavComponentName && !selectedComponent ) {
      console.warn(`CorkHeader: selectedNavComponentName "${this.selectedNavComponentName}" does not match any slotted component.`);
      this.selectedNavComponentName = prevVal;
      return;
    }
    this._selectedNavComponent = selectedComponent;

    // Let the component that was showing know it's hidden (tray closed, or switched to another), e.g. to reset its state
    if ( prevVal && prevVal !== this.selectedNavComponentName ) {
      Object.values(this._slottedComponents).find(c => c.name === prevVal)?.ele?.onNavTrayHide?.();
    }

    const tray = this.renderRoot.querySelector('.nav-tray');
    if ( this.selectedNavComponentName ){
      tray.dataset.navTrayType = this._selectedNavComponent?.navTrayName || '';
      tray.showModal();
      // Focus the tray's content. Its controls are in the slotted element's shadow DOM, which forwards focus to them (delegatesFocus)
      this._selectedNavComponent?.ele?.focus();
    } else {
      tray.close();
      const currentType = tray.dataset?.navTrayType;
      delete tray.dataset.navTrayType;
      if ( currentType ) {
        const toggleButton = this.renderRoot.querySelector(`.header__toggles .nav-tray-toggle[data-toggle="${currentType}"]`);
        if ( toggleButton ) toggleButton.focus();
      }
    }
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
        slot.label = ele?.headerComponentLabel || ele?.getAttribute('header-component-label') || slot.defaultAttributes?.label || slot.name;
        slot.showLabelInNavTrayBar = ele?.showLabelInNavTrayBar || ele?.getAttribute('show-label-in-nav-tray-bar') || slot.defaultAttributes?.showLabelInNavTrayBar || false;
        requestUpdate = true;
      }
    }
    if (requestUpdate) this.requestUpdate();
  }

  /**
   * @description Callback for when a nav toggle button is clicked.
   * @param {Object} component - A record from this._slottedComponents
   */
  _onToggleButtonClick(component) {
    if ( this.selectedNavComponentName === component.name ) {
      this.selectedNavComponentName = null;
    } else {
      this.selectedNavComponentName = component.name;
    }
  }

  /**
   * @description Callback for clicks on the nav tray dialog modal. Closes the tray if the click was outside it.
   * @param {MouseEvent} e - The click event.
   */
  _onNavTrayClick(e) {
    const tray = e.currentTarget;
    if ( e.target !== tray ) return;
    const rect = tray.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if ( !inside ) this.selectedNavComponentName = null;
  }

  /**
   * @description Callback for the nav tray dialog's close event.
   * Clears selectedNavComponentName if the dialog closed itself (e.g. with the Escape key), to keep the toggles in sync.
   */
  _onNavTrayClose() {
    if ( this.selectedNavComponentName ) this.selectedNavComponentName = null;
  }

  /**
   * @description Registers the element as a custom element, unless the tag name is already registered.
   * A class can only be registered once, under one tag name. To register it under another name as well, subclass it first,
   * e.g. class MyElement extends CorkHeader {}; MyElement.define('my-element');
   * @param {String} tagName - Tag name to register. Default: 'cork-header'
   */
  static define(tagName='cork-header'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
