import { LitElement } from 'lit';
import {render, styles} from "./cork-theme-page-controllers-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

import { MarkdownController } from '../../controllers/index.js';

/**
 * @description Page for a single controller's reference doc, e.g. /utils/controllers/NavController,
 * which shows docs/reference/utils/controllers/NavController.md.
 * @property {String} pageId - The page's id in the app's cork-pages. Attribute: page-id.
 */
export default class CorkThemePageControllersSingle extends Mixin(LitElement)
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
      markdown: new MarkdownController(this, e => `reference/${e.location.path.slice(0,3).join('/')}.md`)
    }
  }

}

customElements.define('cork-theme-page-controllers-single', CorkThemePageControllersSingle);
