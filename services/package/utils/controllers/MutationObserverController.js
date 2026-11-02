/**
 * @class MutationObserverController
 * @classdesc Lit controller that attaches a MutationObserver to an element
 * 
 * @property {LitElement} host - 'this' from a Lit element
 * @property {Object} options - MutationObserver.observe options. Default: {childList: true}
 * @property {String|Function} callback - Called on mutation: either the name of an element method, or a function
 * Default: '_onChildListMutation'
 *
 * @examples
 * // For a basic childlist observer, instantiate this class in your element:
 *  mutationObserver = new MutationObserverController(this);
 *
 * // or customize the options/callback:
 *  mutationObserver = new MutationObserverController(this, {childList: true, attributes: true}, 'aDifferentCallbackMethod');
 *
 * // or pass a function:
 *  mutationObserver = new MutationObserverController(this, {childList: true}, (mutationsList) => this._update(mutationsList));
 * 
 * // or from another controller
 * mutationObserver = new MutationObserverController(host, {childList: true}, this._onChildListMutation.bind(this));
 */
export default class MutationObserverController {

  constructor(host, options = {childList: true}, callback = "_onChildListMutation"){
    (this.host = host).addController(this);
    this.options = options;
    this.callback = callback;
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