import { LitElement } from 'lit';
import { render, styles } from "./cork-theme-page-elements-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

import { MarkdownController } from '../../controllers/index.js';

export default class CorkThemePageElementsSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElementMixin) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      elementTag: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.elementTag = '';

    this.ctl = {
      markdown: new MarkdownController(this, e => `reference/${e.location.path.slice(0,2).join('/')}.md`)
    }

    this._injectModel('AppStateModel');
  }

  _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;

    let elementTag = e.location.path?.[1] ? e.location.path[1] : '';
    this.elementTag = elementTag;
  }

}

customElements.define('cork-theme-page-elements-single', CorkThemePageElementsSingle);