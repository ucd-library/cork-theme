/**
 * @function MainDomElementMixin
 * @param {Class} superClass - LitElement or child class.
 * @description set render context for lit element to main DOM instead of the
 * default shadow root
 * 
 * @returns {Class} LitElement updated createRenderRoot function.
 * @example <caption>Render an element into the light DOM</caption>
 * import { LitElement } from 'lit';
 * import { Mixin, MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';
 *
 * class MyElement extends Mixin(LitElement).with(MainDomElementMixin) {
 *   // static styles are added to the element as a style tag, since there's no shadow root
 * }
 */
const MainDomElementMixin = (superClass) => class extends superClass {

  /**
   * @method createRenderRoot
   * @description set the root element to render into
   * 
   * @returns {LitElement}
   */
  createRenderRoot() {
    // hack for inserting styles into main dom
    let styles = this.constructor.elementStyles || [];
    if( !Array.isArray(styles) ) styles = [styles];

    for (const s of styles) {
      const style = document.createElement('style');
      const nonce = global['litNonce'];
      if (nonce !== undefined) {
        style.setAttribute('nonce', nonce);
      }
      style.textContent = s.cssText;
      this.appendChild(style);
    }
    return this;
  }

};

export default MainDomElementMixin;