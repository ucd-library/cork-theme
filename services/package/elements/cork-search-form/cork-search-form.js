import { LitElement } from 'lit';
import { render, styles } from "./cork-search-form.tpl.js";

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A simple search form with optional facet buttons. Can be added as a child of the {@link cork-header} element, or of a {@link cork-search-tray}.
 *
 * On submit:
 *
 * - With formAction set, the form submits natively. Otherwise it fires a cork-search event for the app to handle.
 * - The search button submits as submitParam=Submit, and a facet button as its name=value, so the request says which one was used.
 * - After a search, it asks a parent cork-header to close its nav tray, unless keepTrayOpen is set.
 * @property {String} value - The search text. Cleared when the header's nav tray hides the form.
 * @property {String} placeholder - The input's placeholder. Default: 'Search...'. Attribute: placeholder.
 * @property {String} formAction - URL to submit the form to. If unset, the form fires a cork-search event instead. Attribute: form-action.
 * @property {String} formMethod - HTTP method for a native submit. Default: 'POST'. Attribute: form-method.
 * @property {String} labelText - Visually hidden label for the input. Default: 'Search'. Attribute: label-text.
 * @property {String} queryParam - Name of the input, i.e. the search text's key in the request. Default: 'searchterm'. Attribute: query-param.
 * @property {String} submitParam - Name of the search button, i.e. its key in the request. Default: 'search'. Attribute: submit-param.
 * @property {String} submitAriaLabel - Accessible name of the search button, which shows an icon. Default: 'Search'. Attribute: submit-aria-label.
 * @property {Boolean} clearOnSearch - Clears the input after a cork-search event. Attribute: clear-on-search.
 * @property {Boolean} keepTrayOpen - Keeps the cork-header's nav tray open after a search. Attribute: keep-tray-open.
 * @property {String} categoryBrand - A campus category brand name, e.g. 'admin-blue', for the form's background color. Attribute: category-brand.
 * @slot - Facet buttons: button elements, direct children only. Not an actual slot, but rather parsed and rendered into the shadow DOM as submit buttons.
 *
 * - name: required. Its key in the request.
 * - value: defaults to its text.
 * - aria-label: copied over.
 * @event cork-search - Fired on submit when formAction isn't set.
 *
 * - detail.query: the search text.
 * - detail.facet: the facet button's name, or the submitParam for the search button and the Enter key.
 * @event cork-nav-tray-close-request - Fired after cork-search, unless keepTrayOpen is set. cork-header closes its nav tray.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-search-form';
 *
 * // or the class only, without registering the element:
 * import CorkSearchForm from '@ucd-lib/cork-theme/elements/cork-search-form/cork-search-form.js';
 *
 * @example <caption>Listen for search events</caption>
 * <cork-search-form placeholder="Search the library" @cork-search=${e => this._search(e.detail)}></cork-search-form>
 *
 * @example <caption>Submit a search natively</caption>
 * <cork-search-form form-action="/search" form-method="get"></cork-search-form>
 * 
 * @example <caption>With facet buttons</caption>
 * <cork-search-form placeholder="Search Library Materials">
 *   <button name="books">Books</button>
 *   <button name="articles">Articles</button>
 * </cork-search-form>
 */
export default class CorkSearchForm extends LitElement {

  static get properties() {
    return {
      value: {type: String},
      placeholder: {type: String, attribute: "placeholder"},
      formAction: {type: String, attribute: "form-action"},
      formMethod: {type: String, attribute: "form-method"},
      labelText: {type: String, attribute: "label-text"},
      queryParam: {type: String, attribute: "query-param"},
      submitParam: {type: String, attribute: "submit-param"},
      submitAriaLabel: {type: String, attribute: "submit-aria-label"},
      clearOnSearch: {type: Boolean, attribute: "clear-on-search"},
      keepTrayOpen: {type: Boolean, attribute: "keep-tray-open"},
      categoryBrand: {type: String, attribute: "category-brand"},
      _facets: { state: true}
    }
  }

  static get styles() {
    return styles();
  }

  /**
   * @description Lit shadow root options. delegatesFocus forwards focus() on the element to its first focusable control,
   * e.g. when cork-header opens its nav tray.
   */
  static get shadowRootOptions() {
    return { ...LitElement.shadowRootOptions, delegatesFocus: true };
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.formAction = "";
    this.formMethod = "POST";
    this.labelText = "Search";
    this.placeholder = "Search...";
    this.value = "";
    this.queryParam = "searchterm";
    this.submitParam = "search";
    this.submitAriaLabel = "Search";
    this.clearOnSearch = false;
    this.keepTrayOpen = false;
    this.categoryBrand = "";
    this._facets = [];

    this.ctl = {
      mutationObserver: new MutationObserverController(
        this,
        {
          childList: true,
          attributes: true,
          characterData: true,
          attributeFilter: ['name', 'value', 'aria-label']
        },
        this._onChildListMutation.bind(this)
      )
    };
  }

  /**
   * @description Listener for the form's submit event. Lets the form submit natively if formAction is set.
   * Otherwise cancels the submit and fires a cork-search event instead.
   * @param {SubmitEvent} e - The submit event. e.submitter is the button that submitted the form.
   */
  _onSubmit(e){
    if ( !this.formAction ) {
      e.preventDefault();
      e.stopPropagation();
      this._dispatchSearchEvent(e);
    }
  }

  /**
   * @description Fires the cork-search event, clears the input if clearOnSearch is set,
   * and asks a parent cork-header to close its nav tray unless keepTrayOpen is set.
   * @param {SubmitEvent} e - The submit event, for its submitter's name (the facet).
   */
  _dispatchSearchEvent(e){
    this.dispatchEvent(new CustomEvent('cork-search', {
      bubbles: true,
      composed: true,
      detail: {
        query: this.value,
        facet: e?.submitter?.name || null
      }
    }));

    if ( this.clearOnSearch ) this.value = '';

    // Ask the cork-header (if any) to close its nav tray
    if ( !this.keepTrayOpen ) {
      this.dispatchEvent(new CustomEvent('cork-nav-tray-close-request', { bubbles: true, composed: true }));
    }
  }

  /**
   * @description Callback for MutationObserverController. Also runs when the host connects.
   * Reads the facet buttons from the direct child button elements. Buttons without a name are skipped.
   */
  _onChildListMutation(){
    this._facets = Array.from(this.querySelectorAll(':scope > button')).map((ele) => {
      const name = ele.getAttribute('name');
      if ( !name ) return null;
      const value = ele.getAttribute('value');
      const ariaLabel = ele.getAttribute('aria-label');
      const label = ele.textContent;

      return { name, value, ariaLabel, label, ele };

    }).filter((facet) => facet !== null);
  }

  /**
   * @description Listener for the input's input event. Keeps value in sync with the input.
   * @param {InputEvent} e - The input event.
   */
  _onInput(e){
    this.value = e.target.value;
  }

  /**
   * @description Called by cork-header (directly, or through cork-search-tray) when its nav tray hides this element. Clears the input.
   */
  onNavTrayHide(){
    this.value = '';
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-search-form'
   */
  static define(tagName='cork-search-form'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}