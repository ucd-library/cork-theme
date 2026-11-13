import { LitElement } from 'lit';
import {render, styles} from "./cork-header.tpl.js";

import { AppStateController, MutationObserverController, PageWidthController } from '@ucd-lib/cork-theme/utils/controllers';
import { setImageCssCustomProperties, setFontFaces } from '@ucd-lib/cork-theme/utils/assets';

/**
 * @typedef {Object} SlottedComponent
 * @property {String} name - The slot's name, as used in the slot attribute (e.g. 'primary-nav').
 * @property {HTMLElement|null} ele - The light DOM child currently assigned to the slot, or null if there is none.
 * @property {String|String[]} corkComponentName - Tag name of the cork element that is assigned to this slot automatically (e.g. 'cork-primary-nav').
 * An array accepts any of the tags, checked in order, e.g. ['cork-search-tray', 'cork-search-form']. Only one element is assigned.
 * @property {String} [navTrayName] - Name of the nav tray that this component toggles, if any (e.g. 'menu').
 * @property {Object} [defaultAttributes] - Default attributes to apply to the component if not found as properties or attributes on the element itself.
 * @property {String} [label] - Human readable label for the component
 * @property {Boolean} [showLabelInNavTrayBar] - Whether to show the label in the nav tray bar.
 */

/**
 * @description The primary site header component that accepts various slotted header components and controls their visibility in the nav tray.
 *
 * By default, background images are set via global CSS properties. Without the image-url or background-image-url attributes, the header will have no background art.
 *
 * The image-url and font-url attributes are conveniences for apps without a js entry point to make those calls from.
 * They act on the whole document, not just the header, so use one or the other, not both.
 *
 * The header also sets --page-width on the document with a {@link PageWidthController}, for layout classes such as l-full-width.
 * Set the no-page-width attribute to turn this off.
 *
 * In an SPA using @ucd-lib/cork-app-state, the header closes its open nav tray when the location changes, with an {@link AppStateController}.
 * Set the no-app-state-close attribute to turn this off. In any other SPA, call closeNavTray() from your router on navigation.
 *
 * A slotted component that opens in a nav tray can hook into it:
 *
 * - When the tray opens, the header calls the component's focus(). Use delegatesFocus to pass it to the first control.
 * - When the tray is hidden (closed, or switched to another tray), the header calls its onNavTrayHide() method, if it has one.
 * - To close the open tray, it dispatches a cork-nav-tray-close-request event, with bubbles: true and composed: true.
 * @property {String} backdrop - Campus's header bar variant, '1' (default) to '7'. Attribute: backdrop.
 * @property {String} backgroundImageUrl - Overrides the header bar's background image, whichever backdrop is picked. Attribute: background-image-url.
 * @property {String} navTrayMenuBackgroundImageUrl - Overrides the menu tray's background image. Attribute: nav-tray-menu-background-image-url.
 * @property {String} navTraySearchBackgroundImageUrl - Overrides the search tray's background image. Attribute: nav-tray-search-background-image-url.
 * @property {String} navTrayQuicklinksBackgroundImageUrl - Overrides the quick links tray's main (bottom right) background image. Attribute: nav-tray-quicklinks-background-image-url.
 * @property {String} navTrayQuicklinksAccentImageUrl - Overrides the quick links tray's accent (top left outline) image. Attribute: nav-tray-quicklinks-accent-image-url.
 * @property {String} imageUrl - Base URL of the theme's large images, e.g. '/images/cork-theme'. Passed to setImageCssCustomProperties(), so it sets the --cork-image-* properties for the whole document. Attribute: image-url.
 * @property {String} fontUrl - Base URL of the theme fonts, e.g. '/fonts/cork-theme'. Passed to setFontFaces(), so it loads the fonts for the whole document. Attribute: font-url.
 * @property {Boolean} noPageWidth - Stops the header from setting --page-width, e.g. if the app sets it itself. Attribute: no-page-width.
 * @property {Boolean} noAppStateClose - Stops the header from closing its nav tray on cork-app-state location changes. Attribute: no-app-state-close.
 * @property {String} selectedNavComponentName - Name of the component whose nav tray is currently open. One of the keys of _slottedComponents.
 * @slot primary-nav - Main menu. A child {@link cork-primary-nav} is assigned here automatically.
 * @slot search - Search. A child {@link cork-search-tray} (form and common searches) or a bare {@link cork-search-form} is assigned here automatically.
 * @slot quick-links - Quick links section. A child {@link cork-quick-links} is assigned here automatically.
 * @slot branding-bar - Branding bar. A child {@link cork-branding-bar} is assigned here automatically.
 * @slot nav-lite - Inline main menu in the header bar, shown on larger screens in place of the menu tray toggle. A child {@link cork-nav-lite} is assigned here automatically.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-header';
 *
 * // or the class only, without registering the element:
 * import CorkHeader from '@ucd-lib/cork-theme/elements/cork-header/cork-header.js';
 *
 * @example <caption>Use</caption>
 * <cork-header backdrop="3">
 *   <cork-primary-nav>…</cork-primary-nav>
 *   <cork-search-form>…</cork-search-form>
 *   <cork-quick-links>…</cork-quick-links>
 *   <cork-branding-bar>…</cork-branding-bar>
 * </cork-header>
 *
 * @example <caption>Setting image and font origins via utility functions</caption>
 * // To set where fonts and images are hosted, you can call the utility functions from your app's js entry point:
 * import { setImageCssCustomProperties, setFontFaces } from '@ucd-lib/cork-theme/utils/assets';
 * 
 * // from your own app copied via 'npx cork-theme copy-images' and 'npx cork-theme copy-fonts':
 * setImageCssCustomProperties('/images/cork-theme'); 
 * setFontFaces('/fonts/cork-theme');
 * 
 * // or from the Library's site
 * setImageCssCustomProperties('https://cork-theme.library.ucdavis.edu/images');
 * setFontFaces('https://cork-theme.library.ucdavis.edu/fonts');
 * 
 * @example <caption>Setting image and font origins via attributes</caption>
 * <!-- These attributes call the same utility functions, but from the header element. They act on the whole document, not just the header. -->
 * <cork-header
 *   image-url="https://cork-theme.library.ucdavis.edu/images"
 *   font-url="https://cork-theme.library.ucdavis.edu/fonts">
 *   <cork-primary-nav>…</cork-primary-nav>
 * </cork-header>
 *
 * @example <caption>Overriding images</caption>
 * <!-- replaces the header bar's and the menu tray's background images, for this header only -->
 * <cork-header
 *   background-image-url="/images/my-header-bar.webp"
 *   nav-tray-menu-background-image-url="/images/my-menu-tray.webp">
 *   <cork-primary-nav>…</cork-primary-nav>
 * </cork-header>
 *
 * @example <caption>Custom slotted element</caption>
 * <!-- any element can fill a slot with the slot attribute, in place of the cork element -->
 * <cork-header>
 *   <cork-primary-nav>…</cork-primary-nav>
 *   <div slot="branding-bar" class="my-branding">
 *     <a href="/">My Site</a>
 *   </div>
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
      imageUrl: { type: String, attribute: 'image-url' },
      fontUrl: { type: String, attribute: 'font-url' },
      noPageWidth: { type: Boolean, attribute: 'no-page-width' },
      noAppStateClose: { type: Boolean, attribute: 'no-app-state-close' },
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
    this.imageUrl = '';
    this.fontUrl = '';
    this.noPageWidth = false;
    this.noAppStateClose = false;
    this._lastFullpath = null;
    this.render = render.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
    this.addEventListener('cork-nav-tray-close-request', this._onNavTrayCloseRequest.bind(this));

    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true}, this._onChildListMutation),
      pageWidth: new PageWidthController(this, { shouldInit: () => !this.noPageWidth }),
      appState: new AppStateController(this, { callback: this._onAppStateUpdate, shouldInit: () => !this.noAppStateClose })
    }

    /**
     * @description The header's named slots, and the element currently assigned to each. Kept current by _onChildListMutation.
     * @type {Object}
     * @property {SlottedComponent} primaryNav - The primary-nav slot, for a cork-primary-nav.
     * @property {SlottedComponent} search - The search slot, for a cork-search-tray or cork-search-form.
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
          label: 'Main Menu',
        }
      },
      search: {
        name: 'search', 
        ele: null, 
        corkComponentName: ['cork-search-tray', 'cork-search-form'],
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
      },
      navLite: {
        name: 'nav-lite',
        ele: null,
        corkComponentName: 'cork-nav-lite',
        defaultAttributes: {
          label: 'Main Menu'
        }
      }
    };
  }

  /**
   * @description Standard custom element lifecycle method. Adds the window resize listener.
   */
  connectedCallback(){
    super.connectedCallback();
    window.addEventListener('resize', this._onWindowResize);
  }

  /**
   * @description Standard custom element lifecycle method. Removes the window resize listener.
   */
  disconnectedCallback(){
    window.removeEventListener('resize', this._onWindowResize);
    super.disconnectedCallback();
  }

  /**
   * @description Standard Lit lifecycle method. Opens or closes the nav tray, sets the image and font origins when imageUrl or fontUrl change to a non-empty value,
   * and starts or stops applicable controllers.
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props){
    if ( props.has('selectedNavComponentName') ) {
      this._onSelectedNavComponentNameChange(props.get('selectedNavComponentName'));
    }
    if ( props.has('imageUrl') && this.imageUrl ) {
      setImageCssCustomProperties(this.imageUrl);
    }
    if ( props.has('fontUrl') && this.fontUrl ) {
      setFontFaces(this.fontUrl);
    }
    if ( props.has('noPageWidth') ) {
      this.noPageWidth ? this.ctl.pageWidth.destroy() : this.ctl.pageWidth.init();
    }
    if ( props.has('noAppStateClose') ) {
      this.noAppStateClose ? this.ctl.appState.destroy() : this.ctl.appState.init();
    }
  }

  /**
   * @description Opens a nav tray, closing any other. Same as setting selectedNavComponentName.
   * @param {String} name - Name of the slot whose tray to open, e.g. 'primary-nav', 'search' or 'quick-links'.
   */
  openNavTray(name){
    this.selectedNavComponentName = name;
  }

  /**
   * @description Closes the open nav tray, if any. Call it from an SPA's router on navigation, unless the app uses cork-app-state.
   */
  closeNavTray(){
    if ( this.selectedNavComponentName ) this.selectedNavComponentName = null;
  }

  /**
   * @description Callback for the AppStateController. Closes the open nav tray when the app state's location changes,
   * and ignores other app state updates.
   * @param {Object} state - The cork-app-state app state.
   */
  _onAppStateUpdate(state){
    const fullpath = state?.location?.fullpath;
    if ( fullpath === this._lastFullpath ) return;
    this._lastFullpath = fullpath;
    this.closeNavTray();
  }

  /**
   * @description If the cork-nav-lite has copyFromPrimaryNav set, copies the cork-primary-nav's top-level items to it,
   * up to its primaryNavMaxItems. Called on child list mutations, and on the primary nav's cork-nav-items-update event.
   * @returns {void}
   */
  _copyPrimaryNavItemsToNavLite(){
    const navItems = this._slottedComponents.primaryNav.ele?._corkNavController?.navItems || [];
    const navLite = this._slottedComponents.navLite.ele;
    if ( !navLite?.copyFromPrimaryNav ) return;
    navLite._corkNavController.copyNavItems(navItems, {sliceEnd: navLite.primaryNavMaxItems});
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
  async _onChildListMutation() {

    let requestUpdate = false;
    for (const key in this._slottedComponents) {
      const slot = this._slottedComponents[key];
      let ele = this.querySelector(`:scope > [slot="${slot.name}"]`);
      if ( !ele ) {
        // Check the tag names in order, so the first one listed wins if more than one is present
        for ( const tagName of [].concat(slot.corkComponentName) ) {
          ele = this.querySelector(`:scope > ${tagName}:not([slot])`);
          if ( ele ) break;
        }
        if ( ele ) ele.setAttribute('slot', slot.name);
      }

      if ( ele !== slot.ele ) {
        slot.ele = ele;
        slot.label = ele?.headerComponentLabel || ele?.getAttribute('header-component-label') || slot.defaultAttributes?.label || slot.name;
        slot.showLabelInNavTrayBar = ele?.showLabelInNavTrayBar || ele?.getAttribute('show-label-in-nav-tray-bar') || slot.defaultAttributes?.showLabelInNavTrayBar || false;
        requestUpdate = true;
      }
    }
    if ( requestUpdate ) {
      this.requestUpdate();
      await this.updateComplete;
      this._copyPrimaryNavItemsToNavLite();
    }
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
   * @description Callback for the window resize event. Closes the open nav tray if its toggle button is hidden,
   * e.g. the menu toggle on wide screens when a nav-lite menu is in the header bar, which would leave the tray with no close button.
   * Only acts when a nav-lite component is slotted, as campus's nav-tray.js does.
   */
  _onWindowResize() {
    if ( !this.selectedNavComponentName || !this._slottedComponents.navLite.ele ) return;
    const type = this._selectedNavComponent?.navTrayName;
    const toggleButton = this.renderRoot.querySelector(`.nav-tray__toggles .nav-tray-toggle[data-toggle="${type}"]`);
    if ( toggleButton && !toggleButton.checkVisibility() ) this.selectedNavComponentName = null;
  }

  /**
   * @description Callback for the nav tray dialog's close event.
   * Clears selectedNavComponentName if the dialog closed itself (e.g. with the Escape key), to keep the toggles in sync.
   */
  _onNavTrayClose() {
    this.closeNavTray();
  }

  /**
   * @description Listener for the cork-nav-tray-close-request event, which a slotted component (or anything inside the header) fires to close the open nav tray,
   * e.g. after a search. Ignored if no tray is open.
   */
  _onNavTrayCloseRequest() {
    this.closeNavTray();
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
