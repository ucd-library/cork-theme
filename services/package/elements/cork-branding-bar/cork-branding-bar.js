import { LitElement } from 'lit';
import { render, styles } from "./cork-branding-bar.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description The site's masthead: a logo and the site name, with an optional slogan, both linking to the site's homepage. Add it as a child of the {@link cork-header} element.
 * @property {String} siteName - Name of the site. Default: 'UC Davis Library'. Attribute: site-name.
 * @property {String} siteUrl - URL for the logo and site name links. Default: '/'. Attribute: site-url.
 * @property {String} slogan - Optional text below the site name. Attribute: slogan.
 * @property {Boolean} noSiteLogo - Hides the logo. Attribute: no-site-logo.
 * @slot site-logo - Custom logo, in place of the library's book logo. The first direct child img element is assigned here automatically.
 *
 * - It needs no alt text, since the logo link is hidden from assistive technology.
 * - Size it with the app's own CSS, since it stays in the light DOM.
 * 
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-branding-bar';
 * 
 * // or the class only, without registering the element:
 * import CorkBrandingBar from '@ucd-lib/cork-theme/elements/cork-branding-bar/cork-branding-bar.js';
 *
 * @example <caption>Use</caption>
 * <!-- Default Library Branding -->
 * <cork-branding-bar></cork-branding-bar>
 * 
 * <!-- Custom Site Branding -->
 * <cork-branding-bar site-name="Special Collections" site-url="/special-collections" slogan="Archives and rare books"></cork-branding-bar>
 *
 * <!-- with a custom logo -->
 * <cork-branding-bar site-name="DataLab">
 *   <img src="/images/datalab-logo.svg">
 * </cork-branding-bar>
 */
export default class CorkBrandingBar extends LitElement {

  static get properties() {
    return {
      noSiteLogo: {type: Boolean, attribute: "no-site-logo"},
      siteName: {type: String, attribute: "site-name"},
      siteUrl: {type: String, attribute: "site-url"},
      slogan: {type: String}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.noSiteLogo = false;
    this.siteName = "UC Davis Library";
    this.siteUrl = "/";
    this.slogan = "";

    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true}, this._onChildListMutation)
    }
  }

  /**
   * @description Callback for MutationObserverController. Also runs when the host connects.
   * Assigns the first direct child img element to the site-logo slot, and unassigns any others.
   */
  _onChildListMutation() {
    const imgs = this.querySelectorAll(':scope > img');
    imgs.forEach((img, index) => {
      if (index === 0) {
        img.setAttribute('slot', 'site-logo');
        img.classList.add('site-logo');
      } else {
        img.removeAttribute('slot');
        img.classList.remove('site-logo');
      }
    });
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-branding-bar'
   */
  static define(tagName='cork-branding-bar'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}