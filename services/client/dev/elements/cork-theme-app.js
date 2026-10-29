import { LitElement } from 'lit';
import {render, styles} from "./cork-theme-app.tpl.js";

// global css
import '../css/index.js';

import { Registry, LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

// elements
import '@ucd-lib/cork-theme/elements/cork-header.js';

// icon elements and model
import '@ucd-lib/cork-icon';

// cork models
import '../lib/cork/models/AppStateModel.js';
Registry.ready();

export default class CorkThemeApp extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElementMixin) {

  static get properties() {
    return {
      page: {type: String},
      _firstAppStateUpdate : { state: true },
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.page = '';
    this._firstAppStateUpdate = false;

    this._injectModel('AppStateModel');
  }

  /**
   * @description Called after the element's first render. Triggers an AppStateModel refresh
   * to load the initial page state.
   */
  firstUpdated(){
    this.AppStateModel.refresh();
  }

  /**
   * @description Handles app-state updates. Hides the full-site loader on first call,
   * closes the nav, loads any required JS bundle for the new page, and updates the
   * active page property.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    this.logger.info('appStateUpdate', e);
    if ( !this._firstAppStateUpdate ) {
      this._firstAppStateUpdate = true;
      this.hideFullSiteLoader();
    }
    // this.closeNav();
    const { page, location } = e;

    // const bundleLoadedForFirstTime = await bundleLoader.loadForPage(page);
    // if ( bundleLoadedForFirstTime ) {
    //   this.AppStateModel.refresh();
    //   return;
    // }

    this.page = page;
  }

  /**
   * @description Hide the full site loader after a timeout
   * @param {*} timeout
   */
  async hideFullSiteLoader(timeout=300){
    await new Promise(resolve => setTimeout(resolve, timeout));
    document.querySelector('#site-loader').style.display = 'none';
    this.style.display = 'block';
  }

  /**
   * @description Close the app's primary nav menu
   */
  closeNav(){
    // todo
  }

}

customElements.define('cork-theme-app', CorkThemeApp);