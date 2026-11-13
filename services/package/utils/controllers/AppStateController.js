/**
 * @class AppStateController
 * @description Lit controller that calls back on @ucd-lib/cork-app-state's app-state-update event, if it exists.
 * 
 * Use it if you are unsure whether cork-app-state is registered, or if you want to avoid a direct dependency on it. If cork-app-state is not registered, the controller does nothing.
 *
 * @param {LitElement} host - 'this' from a Lit element
 * @param {Object} opts - Options.
 * @param {String|Function} opts.callback - Called with the app state on app-state-update: either the name of a host method, or a function. Default: '_onAppStateUpdate'
 * @param {Function} opts.shouldInit - Called when the host connects. The controller only starts if it returns true. Default: always start.
 * @example <caption>Host method</caption>
 * // in a Lit element's constructor. Calls this._onAppStateUpdate(state)
 * this.ctl = { appState: new AppStateController(this) };
 *
 * @example <caption>Function callback</caption>
 * this.ctl = { appState: new AppStateController(this, { callback: this._onLocationChange }) };
 *
 * @example <caption>Only start while a property is off</caption>
 * this.ctl = { appState: new AppStateController(this, { shouldInit: () => !this.noAppState }) };
 * 
 * // and handle property changes in willUpdate() to start or stop the controller
 * willUpdate(props){
 *  if ( props.has('noAppState') ) {
 *   this.noAppState ? this.ctl.appState.destroy() : this.ctl.appState.init();
 *  }
 * }
 *
 * @example <caption>Start later</caption>
 * // if the AppStateModel is registered after the host connects
 * this.ctl.appState.init();
 */
export default class AppStateController {

  constructor(host, opts={}){
    this.host = host;
    this.callback = opts.callback || '_onAppStateUpdate';
    this.shouldInit = opts.shouldInit || (() => true);
    this.eventName = 'app-state-update';
    this._initialized = false;
    this._model = null;
    this._onAppStateUpdate = this._onAppStateUpdate.bind(this);
    host.addController(this);
  }

  /**
   * @description Lit lifecycle method. Starts the controller, if opts.shouldInit allows.
   */
  hostConnected(){
    if ( this.shouldInit() ) this.init();
  }

  /**
   * @description Lit lifecycle method. Stops the controller.
   */
  hostDisconnected(){
    this.destroy();
  }

  /**
   * @description Gets cork-app-state's AppStateModel from cork-app-utils' global registry.
   * @returns {Object|null} The model, or null if none is registered.
   */
  getAppStateModel(){
    return window._corkAppUtils?.Registery?.models?.AppStateModel || null;
  }

  /**
   * @description Starts listening for app-state-update. Does nothing if already started, or if no AppStateModel is registered.
   * @returns {Boolean} Whether the controller is started.
   */
  init(){
    if ( this.isInitialized() ) return true;
    const model = this.getAppStateModel();
    if ( !model?.EventBus ) return false;
    this._model = model;
    this._model.EventBus.on(this.eventName, this._onAppStateUpdate);
    this._initialized = true;
    return true;
  }

  /**
   * @description Checks if the controller has been started.
   * @returns {Boolean}
   */
  isInitialized(){
    return this._initialized;
  }

  /**
   * @description Stops listening for app-state-update. Does nothing if not started.
   */
  destroy(){
    if ( !this.isInitialized() ) return;
    this._model.EventBus.removeListener(this.eventName, this._onAppStateUpdate);
    this._model = null;
    this._initialized = false;
  }

  /**
   * @description Runs the callback: a function is called with the host as 'this'; a string is called as a host method.
   * @param {Object} state - The app state, e.g. state.location.
   */
  _onAppStateUpdate(state){
    if ( typeof this.callback === 'function' ) {
      this.callback.call(this.host, state);
      return;
    }
    if ( !this.host[this.callback] ){
      console.warn(
        `Element has no '${this.callback}' method.
        Either add this method, or change the 'callback' option on instantiation.`
      );
      return;
    }
    this.host[this.callback](state);
  }
}
