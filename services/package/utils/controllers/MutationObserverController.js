/**
 * @class MutationObserverController
 * @classdesc Lit controller that attaches a MutationObserver to an element
 * 
 * @property {LitElement} host - 'this' from a Lit element
 * @property {Object} options - MutationObserver.observe options. Default: {childList: true}
 * @property {String} callback - Name of element method called on mutation. Default: '_onChildListMutation'
 * 
 * @examples
 * // For a basic childlist observer, instantiate this class in your element:
 *  mutationObserver = new MutationObserverController(this);
 * 
 * // or customize the options/callback:
 *  mutationObserver = new MutationObserverController(this, {childList: true, attributes: true}, 'aDifferentCallbackMethod');
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

  _onMutation(mutationsList, observer){
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