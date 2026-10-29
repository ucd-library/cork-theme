import { LitElement } from 'lit';
import {render, styles} from "./cork-header.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A site header component.
 * @property {String} backgroundImageUrl - Overrides the header bar's default background image. Attribute: background-image-url.
 */
export default class CorkHeader extends LitElement {

  static get properties() {
    return {
      backgroundImageUrl: { type: String, attribute: 'background-image-url' },
      slottedComponents: { type: Object }
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

    this.slottedComponents = {
      primaryNav: null,
      search: null,
      quickLinks: null,
      brandingBar: null
    };
  }

  _onChildListMutation() {}

}

if ( !customElements.get('cork-header') ) { 
  customElements.define('cork-header', CorkHeader);
} 