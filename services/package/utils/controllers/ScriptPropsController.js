import MutationObserverController from './MutationObserverController.js';

/**
 * @class ScriptPropsController
 * @classdesc Lit controller that sets the host's properties from a JSON script tag in its light DOM.
 * Useful for setting complex properties (objects, arrays, etc.) from server-rendered markup.
 * The script is read when the host connects, before its first render, and again whenever the script's text changes.
 *
 * - Only the host's declared reactive properties are set, leaving out state properties.
 * - Last write wins: at connection, the script's values override constructor defaults and attributes. Later attribute or property changes
 * override them, until the script's text changes again.
 * - Removing a key from the JSON doesn't change its property back.
 * - Invalid JSON, or JSON that isn't an object, is logged as a console error and changes nothing.
 *
 * @property {LitElement} host - 'this' from a Lit element
 * @property {String} selector - Selector for the script tag, run from the host. Default: ':scope > script[type="application/json"]'
 * @property {Object|null} props - The object last parsed from the script, or null.
 *
 * @example <caption>Instantiation</caption>
 * import { ScriptPropsController } from '@ucd-lib/cork-theme/utils/controllers';
 *
 * // in the host element's constructor
 * this.ctl = { scriptProps: new ScriptPropsController(this) };
 * // or with a more specific script tag
 * this.ctl = { scriptProps: new ScriptPropsController(this, { selector: ':scope > script[type="application/json"][data-props]' }) };
 *
 * @example <caption>Server-rendered markup</caption>
 * <my-results>
 *   <script type="application/json">
 *     { "query": "cats", "page": 2, "filters": { "format": "book" } }
 *   </script>
 * </my-results>
 *
 * @example <caption>Setting properties from an object</caption>
 * // the same checks, for values from elsewhere
 * this.ctl.scriptProps.setProps({ page: 3 });
 */
export default class ScriptPropsController {

  /**
   * @param {LitElement} host - 'this' from a Lit element
   * @param {Object} opts - Options.
   * @param {String} opts.selector - Selector for the script tag, run from the host. Default: ':scope > script[type="application/json"]'
   */
  constructor(host, opts={}){
    this.host = host;
    this.selector = opts.selector || ':scope > script[type="application/json"]';
    this.props = null;
    this._scriptText = null;

    host.addController(this);

    this.mutationObserver = new MutationObserverController(
      host,
      { childList: true, subtree: true, characterData: true },
      this._onMutation.bind(this)
    );
  }

  /**
   * @description Callback for MutationObserverController. Also runs when the host connects.
   * Parses the script tag and sets the host's properties from it, if its text changed since it was last read.
   */
  _onMutation(){
    const script = this.host.querySelector(this.selector);
    if ( !script ) return;
    const text = script.textContent;
    if ( text === this._scriptText ) return;
    this._scriptText = text;
    if ( !text.trim() ) return;

    let props;
    try {
      props = JSON.parse(text);
    } catch (e) {
      console.error(`${this.host.localName}: could not parse its JSON script tag`, e);
      return;
    }
    if ( !props || typeof props !== 'object' || Array.isArray(props) ) {
      console.error(`${this.host.localName}: its JSON script tag must hold an object`, props);
      return;
    }
    this.props = props;
    this.setProps(props);
  }

  /**
   * @description Sets the host's properties from an object. Keys that aren't allowed (see getAllowedProperties) are skipped with one console warning.
   * @param {Object} props - Property values, keyed by property name.
   */
  setProps(props={}){
    const allowed = this.getAllowedProperties();
    const skipped = [];
    for ( const [key, value] of Object.entries(props) ) {
      if ( !allowed.includes(key) ) {
        skipped.push(key);
        continue;
      }
      this.host[key] = value;
    }
    if ( skipped.length ) {
      console.warn(`${this.host.localName}: skipped JSON keys that aren't public properties: ${skipped.join(', ')}`);
    }
  }

  /**
   * @description Gets the names of the properties that can be set: the host's declared reactive properties, including inherited ones,
   * leaving out state properties.
   * @returns {String[]}
   */
  getAllowedProperties(){
    const allowed = [];
    for ( const [name, options] of this.host.constructor.elementProperties || [] ) {
      if ( options?.state ) continue;
      allowed.push(name);
    }
    return allowed;
  }
}
