import { LitElement } from 'lit';
import {render, styles} from "./cork-theme-page-elements.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

export default class CorkThemePageElements extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElementMixin) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
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

customElements.define('cork-theme-page-elements', CorkThemePageElements);