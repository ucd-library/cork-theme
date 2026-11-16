import { LitElement } from 'lit';
import {render, styles} from "./cork-theme-page-utils.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

import { MarkdownController } from '../../controllers/index.js';

export default class CorkThemePageUtils extends Mixin(LitElement)
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

    this.ctl = {
      markdown: new MarkdownController(this, 'reference/readme.md')
    }
  }

}

customElements.define('cork-theme-page-utils', CorkThemePageUtils);