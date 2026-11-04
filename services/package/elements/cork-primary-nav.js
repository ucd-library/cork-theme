import { LitElement } from 'lit';
import { render, styles } from "./cork-primary-nav.tpl.js";

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

export default class CorkPrimaryNav extends LitElement {

  static get properties() {
    return {
      headerComponentLabel: { type: String, attribute: 'header-component-label' },
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
      },
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.headerComponentLabel = 'Main Menu';
    this.focusedNavItem = [];

    this.ctl = {
      nav: new NavController(this)
    }
  }

}

if ( !customElements.get('cork-primary-nav') ) {
  customElements.define('cork-primary-nav', CorkPrimaryNav);
}