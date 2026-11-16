import { LitElement } from 'lit';
import {render, styles} from "./cork-theme-page-utils-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

import { MarkdownController } from '../../controllers/index.js';

// util folders whose docs are split into a page per file, with a readme.md index (SPLIT_UTILS in package-tools/lib/docs.js)
const SPLIT_UTILS = ['controllers'];

export default class CorkThemePageUtilsSingle extends Mixin(LitElement)
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
      markdown: new MarkdownController(this, e => this._docPath(e.location.path))
    }
  }

  /**
   * @description Gets the reference doc for a util page: a folder's readme.md for a util split into a page per file (e.g. /utils/controllers),
   * otherwise the util's own page (e.g. /utils/assets).
   * @param {String[]} path - The location path, e.g. ['utils', 'assets'].
   * @returns {String} Doc path, e.g. 'reference/utils/assets.md'.
   */
  _docPath(path=[]){
    const base = `reference/${path.slice(0,2).join('/')}`;
    return SPLIT_UTILS.includes(path[1]) ? `${base}/readme.md` : `${base}.md`;
  }

}

customElements.define('cork-theme-page-utils-single', CorkThemePageUtilsSingle);