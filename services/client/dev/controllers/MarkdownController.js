import { Registry } from '@ucd-lib/cork-app-utils';
import AppComponentController from './AppComponentController.js';

/**
 * @description Controller that loads a markdown document from the DocModel for its host, and reloads it on app state updates while the host is on the active page.
 * @param {LitElement} host - The host element
 * @param {String|Function} docPath - Path of the document to load, e.g. 'reference/elements/cork-header.md'.
 * Or a function that is called with the app state and returns the path. A falsy path clears the document.
 * @param {Object} opts - Options
 * @property {HTMLElement} host - The host element
 * @property {String|Function} docPath - The docPath argument
 * @property {Object} opts - The opts argument
 * @property {Object} models - The AppStateModel and DocModel
 * @property {AppComponentController} appComponentController - Tells whether the host is on the active page
 * @property {Object|null} document - The loaded document (the DocModel payload), or null if none is loaded or it failed to load
 * @example <caption>Load a document with a static path</caption>
 * this.ctl = {
 *   markdown: new MarkdownController(this, 'reference/elements/cork-header.md')
 * };
 * 
 * @example <caption>Load a document based on the current location</caption>
 * this.ctl = {
 *   markdown: new MarkdownController(this, e => `reference/${e.location.path.slice(0,2).join('/')}.md`)
 * };
 */
export default class MarkdownController {

  constructor(host, docPath, opts={}) {
    this.host = host;
    this.docPath = docPath;
    this.opts = opts;

    this.models = {
      AppStateModel: Registry.getModel('AppStateModel'),
      DocModel: Registry.getModel('DocModel')
    }

    this.appComponentController = new AppComponentController(host);

    this.document = null;
    this._onAppStateUpdate = this._onAppStateUpdate.bind(this);

    host.addController(this);
  }

  /**
   * @description Renders the loaded document. Not implemented yet.
   * @param {Object} opts - Options
   */
  render(opts={}){
    //todo
  }

  /**
   * @description Not implemented yet.
   */
  _render(){
    //todo
  }

  /**
   * @description Renders one section of the loaded document. Not implemented yet.
   * @param {*} section - The section to render
   * @param {Object} opts - Options
   */
  renderSection(section, opts={}){
    //todo
  }

  /**
   * @description Loads the document at docPath from the DocModel into this.document, and requests a host update.
   * @returns {Promise<Object|null>} The document, or null if there's no path or it failed to load.
   */
  async getDocument(){
    let docPath;
    if ( typeof this.docPath === 'function' ){
      docPath = this.docPath(this.models.AppStateModel.store.data);
    } else {
      docPath = this.docPath;
    }

    if ( !docPath ) {
      this.document = null;
    } else {
      const r = await this.models.DocModel.get(docPath);
      if ( r.state === 'error' ) {
        this.document = null;
      } else {
        this.document = r.payload;
      }
    }

    this.host.requestUpdate();
    return this.document;
  }

  /**
   * @description Callback for the app-state-update event. Reloads the document if the host is on the active page.
   */
  _onAppStateUpdate(){
    if ( !this.appComponentController.isOnActivePage ) return;
    this.getDocument();
  }


  /**
   * @description Register event listeners when the host is connected to the DOM
   */
  hostConnected() {
    this.models.AppStateModel.EventBus.on('app-state-update', this._onAppStateUpdate);
  }

  /**
   * @description Remove event listeners when the host is disconnected from the DOM
   */
  hostDisconnected() {
    this.models.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate);
  }
}