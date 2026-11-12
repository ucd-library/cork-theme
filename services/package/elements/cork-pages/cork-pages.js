import { LitElement } from 'lit';

import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';
import { Mixin, MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

/**
 * @description Shows one of its children at a time, and hides the rest. The selected child is picked by index, or by an attribute value (id by default).
 * @property {String} selected - The child to show. A whole number (e.g. '0') is a child index.
 * Anything else is matched against each child's attrForSelected attribute. Attribute: selected.
 * @property {String} attrForSelected - Attribute of the children that selected value is matched against. Default: 'id'. Attribute: attr-for-selected.
 * @property {String} selectedAttribute - An attribute to add to the selected child, and remove from the rest. Optional. Attribute: selected-attribute.
 * @property {String} fallbackSelection - The child to show when selected matches nothing, e.g. a not-found page. Matched like selected. Attribute: fallback-selection.
 * @property {String} inlineDisplayValue - Inline display style for the selected child, e.g. ele.style.display = 'flex'. Default: 'block'. Attribute: inline-display-value.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-pages';
 *
 * // or the class only, without registering the element:
 * import CorkPages from '@ucd-lib/cork-theme/elements/cork-pages/cork-pages.js';
 *
 * @example <caption>Select by id</caption>
 * <cork-pages selected="search">
 *   <div id="home">…</div>
 *   <div id="search">…</div>
 * </cork-pages>
 *
 * @example <caption>Select by index</caption>
 * <cork-pages selected="1">
 *   <div>…</div>
 *   <div>…</div>
 * </cork-pages>
 *
 * @example <caption>Select by another attribute, with a fallback and a selected attribute</caption>
 * <!-- e.g. from an SPA's current route -->
 * <cork-pages
 *   selected=${this.page}
 *   attr-for-selected="page-id"
 *   fallback-selection="not-found"
 *   selected-attribute="active">
 *   <app-home page-id="home"></app-home>
 *   <app-search page-id="search"></app-search>
 *   <app-not-found page-id="not-found"></app-not-found>
 * </cork-pages>
 */
export default class CorkPages extends Mixin(LitElement)
  .with(MainDomElementMixin) {
    
  static get properties() {
    return {
      selected: {type: String},
      attrForSelected: {type: String, attribute: 'attr-for-selected'},
      selectedAttribute: {type: String, attribute: 'selected-attribute'},
      fallbackSelection: {type: String, attribute: 'fallback-selection'},
      inlineDisplayValue: {type: String, attribute: 'inline-display-value'}
    }
  }

  constructor() {
    super();
    this.selected = '';
    this.attrForSelected = 'id';
    this.selectedAttribute = '';
    this.fallbackSelection = '';
    this.inlineDisplayValue = 'block';
    this.ctl = {
      mutationObserver: new MutationObserverController(this, {childList: true}, this._onChange)
    };
  }

  /**
   * @description Standard Lit lifecycle method. Defaults an empty attrForSelected to 'id' and an empty inlineDisplayValue to 'block', and updates which child is shown when any property changes.
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props) {
    if ( props.has('attrForSelected') && !this.attrForSelected ) this.attrForSelected = 'id';
    if ( props.has('inlineDisplayValue') && !this.inlineDisplayValue ) this.inlineDisplayValue = 'block';
    
    const attributes = ['selected', 'attrForSelected', 'selectedAttribute', 'fallbackSelection', 'inlineDisplayValue'];
    if( attributes.some(attr => props.has(attr)) ) {
      this._onChange();
    }
  }

  /**
   * @description Shows the child that selected matches, or else the one fallbackSelection matches, and hides the rest.
   * Called on property changes, and by the mutation observer.
   */
  _onChange() {
    let selected = 0;

    // find what the selected attribute is
    if( this.selected !== undefined && this.selected !== null ) {
      if( typeof this.selected === 'string' && /^\d+$/.test(this.selected) ) {
        selected = parseInt(this.selected);
      } else {
        selected = this.selected;
      }
    }

    // loop through and hide/show children
    let found = this._updateVisibility(selected, this.attrForSelected);

    // if nothing found, check fallback selection
    if( !found && this.fallbackSelection ) {
      if( /^\d+$/.test(this.fallbackSelection) ) {
        selected = parseInt(this.fallbackSelection);
      } else {
        selected = this.fallbackSelection;
      }

      found = this._updateVisibility(selected, this.attrForSelected);
    } 
  }

  /**
   * @description Shows the matching child and hides the rest.
   * @param {Number|String} selected - A child index, or a value to match against each child's attr.
   * @param {String} attr - Attribute to match a string selected against.
   * @returns {Boolean} Whether a child matched.
   */
  _updateVisibility(selected, attr) {
    let children = [...this.children];
    let found = false;
    let useIndex = (typeof selected === 'number');
    let val;

    for( let i = 0; i < children.length; i++ ) {
      if( useIndex ) {
        this._select((i === selected), children[i], this.selectedAttribute);
        if( !found ) found = (i === selected);
        continue;
      }

      val = children[i].getAttribute(attr);
      this._select((val === selected), children[i], this.selectedAttribute);
      if( !found ) found = (val === selected);
    }

    return found;
  }

  /**
   * @description Shows or hides a child, and adds or removes its selected attribute.
   * @param {Boolean} value - Whether the child is selected.
   * @param {Element} child - The child.
   * @param {String} attribute - The selected attribute (selectedAttribute), if any.
   */
  _select(value, child, attribute) {
    if( value ) {
      if( attribute ) child.setAttribute(attribute, attribute);
      child.style.display = this.inlineDisplayValue;
    } else {
      if( attribute ) child.removeAttribute(attribute, attribute);
      child.style.display = 'none';
    }
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-pages'
   */
  static define(tagName='cork-pages'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
