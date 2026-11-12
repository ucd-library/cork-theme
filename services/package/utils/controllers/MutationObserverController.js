/**
 * @class MutationObserverController
 * @classdesc Lit controller that attaches a MutationObserver to an element
 * 
 * @property {LitElement} host - 'this' from a Lit element
 * @property {Object} options - MutationObserver.observe options. Default: {childList: true}
 * @property {String|Function} callback - Called on mutation: either the name of an element method, or a function
 * Default: '_onChildListMutation'
 *
 * @example <caption>Basic childlist observer</caption>
 *  mutationObserver = new MutationObserverController(this);
 *
 * @example <caption>Custome the options/callback</caption>
 *  mutationObserver = new MutationObserverController(this, {childList: true, attributes: true}, 'aDifferentCallbackMethod');
 *
 * @example <caption>Use a function as the callback</caption>
 *  mutationObserver = new MutationObserverController(this, {childList: true}, this._onMutation);
 * 
 * @example <caption>Use from another controller</caption>
 * mutationObserver = new MutationObserverController(host, {childList: true}, this._onChildListMutation.bind(this));
 *
 * @example <caption>Change the options later</caption>
 * // e.g. start watching attributes too, and run the callback now to catch up
 * mutationObserver.updateOptions({childList: true, attributes: true}, true);
 */
export default class MutationObserverController {

  constructor(host, options = {childList: true}, callback = "_onChildListMutation"){
    this.host = host;
    this.options = options;
    this.callback = callback;
    host.addController(this);
  }

  hostConnected(){

    this._observer = new MutationObserver(
      (mutationsList, observer) => this._onMutation(mutationsList, observer)
    );
    this._observer.observe(this.host, this.options);
    this._onMutation();
  }

  hostDisconnected(){
    this._observer.disconnect();
    this._observer = null;
  }

  /**
   * @description Replaces the observer's options. If the host is connected, the observer is re-attached with them;
   * otherwise they're used when it connects. Mutations already queued are kept.
   * @param {Object} options - MutationObserver.observe options, e.g. {childList: true, attributes: true}. Replaces the old options, rather than merging with them.
   * @param {Boolean} runCallback - Also runs the callback now, with no arguments, as on host connection. Default: false
   */
  updateOptions(options, runCallback=false){
    this.options = options;
    if ( this._observer ) this._observer.observe(this.host, this.options);
    if ( runCallback ) this._onMutation();
  }

  /**
   * @description Runs the callback: a function is called with the host as 'this'; a string is called as a host method.
   * Also run once, with no arguments, when the host connects.
   * @param {MutationRecord[]} mutationsList - The mutations, if any.
   * @param {MutationObserver} observer - The observer, if any.
   */
  _onMutation(mutationsList, observer){
    if ( typeof this.callback === 'function' ) {
      this.callback.call(this.host, mutationsList, observer);
      return;
    }
    if ( !this.host[this.callback]){
      console.warn(
        `Element has no '${this.callback}' method. 
        Either add this method, or change the 'callback' argument on instantiation.`
      );
      return;
    }
    this.host[this.callback](mutationsList, observer);
  }
}