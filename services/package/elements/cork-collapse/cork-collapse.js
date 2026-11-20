import { LitElement } from 'lit';
import { render, styles } from "./cork-collapse.tpl.js";
import { up, down } from 'slide-element';

import { HeadingController } from '@ucd-lib/cork-theme/utils/controllers';


/**
 * @description A box with a title bar that shows and hides its content.
 * 
 * To alter the color of the title bar, add a category brand class to the element, e.g. class="category-brand--rec-pool".
 * This requires the theme's global stylesheet for brand classes be loaded.
 * @property {Boolean} open - Whether the content is shown. Starting open shows it without animating.
 * Later changes, from a title click or from code, slide it open or closed. Attribute: open (reflected).
 * @slot - The title and the content.
 * The title is derived from the first h1-h6 child. All heading levels are styled the same. 
 * You can use a div/span with the data-heading attribute instead of a heading element.
 * See {@link HeadingController}.
 * Everything else is the content, and keeps the page's styles.
 * @event cork-collapse-toggle - Fired when a title click toggles open. Not fired when open is set from code.
 * detail.open: whether it's now open. Bubbles and is composed.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-collapse';
 *
 * // or the class only, without registering the element:
 * import CorkCollapse from '@ucd-lib/cork-theme/elements/cork-collapse/cork-collapse.js';
 *
 * @example <caption>Heading</caption>
 * <cork-collapse>
 *   <h3>How do I renew a book?</h3>
 *   <p>Sign in to your <a href="/account">library account</a> and choose Renew.</p>
 *   <p>Or call the library at 555-555-5555.</p>
 * </cork-collapse>
 *
 * @example <caption>No heading element</caption>
 * <cork-collapse>
 *   <div data-heading>More details</div>
 *   <p>Supplementary details.</p>
 * </cork-collapse>
 *
 * @example <caption>Open</caption>
 * <cork-collapse open>
 *   <h3>Hours</h3>
 *   <p>Open 24 hours during finals.</p>
 * </cork-collapse>
 *
 * @example <caption>Brand color</caption>
 * <cork-collapse class="category-brand--rec-pool">
 *   <h3>Recreation</h3>
 *   <p>Content.</p>
 * </cork-collapse>
 *
 * @example <caption>Listening for toggles</caption>
 * collapse.addEventListener('cork-collapse-toggle', e => {
 *   console.log(e.detail.open);
 * });
 */
export default class CorkCollapse extends LitElement {

  static get properties() {
    return {
      open: { type: Boolean, reflect: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.open = false;
    this._headingEle = null;

    this.ctl = {
      heading: new HeadingController(this)
    }

    this.addEventListener('cork-heading-update', this._onHeadingUpdate.bind(this));
    this.addEventListener('cork-heading-click', this._onHeadingClick.bind(this));
  }

  /**
   * @description The shadow DOM element that wraps the content slot, and slides open and closed.
   * @returns {HTMLElement|null}
   */
  get contentEle(){
    return this.renderRoot?.querySelector?.('.collapse__content') || null;
  }

  /**
   * @description Hides the content on the first render if closed, so it doesn't animate.
   */
  firstUpdated(){
    if ( !this.open ) this.contentEle.style.display = 'none';
  }

  /**
   * @description Slides the content open or closed when open changes after the first render.
   * @param {Map} props - Changed properties, with their previous values.
   */
  updated(props){
    if ( !props.has('open') || props.get('open') === undefined ) return;
    if ( this.open ) {
      down(this.contentEle);
    } else {
      up(this.contentEle);
    }
  }

  /**
   * @description Moves the light DOM heading out of the content slot, when the HeadingController parses it.
   * Ignores events from collapses nested in the content.
   * @param {CustomEvent} e - cork-heading-update event
   */
  _onHeadingUpdate(e){
    const headingSlot = 'heading';
    if ( e.target !== this ) return;
    const headingEle = e.detail.heading?.headingEle || null;
    if ( this._headingEle && this._headingEle !== headingEle && this._headingEle.slot === headingSlot ) {
      this._headingEle.removeAttribute('slot');
    }
    if ( headingEle ) headingEle.slot = headingSlot;
    this._headingEle = headingEle;
  }

  /**
   * @description Toggles the content when the title is clicked, and fires cork-collapse-toggle.
   * Ignores events from collapses nested in the content.
   * @param {CustomEvent} e - cork-heading-click event
   */
  _onHeadingClick(e){
    if ( e.target !== this ) return;
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent('cork-collapse-toggle', {
      detail: { open: this.open },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-collapse'
   */
  static define(tagName='cork-collapse'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
