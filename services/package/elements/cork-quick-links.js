import { LitElement } from 'lit';
import {render, styles} from "./cork-quick-links.tpl.js";

export default class CorkQuickLinks extends LitElement {

  static get properties() {
    return {
      
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
  }

}

if ( !customElements.get('cork-quick-links') )
  customElements.define('cork-quick-links', CorkQuickLinks);