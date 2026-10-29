/**
 * @function MainDomElementMixin
 * @param {Class} superClass - LitElement or child class.
 * @description set render context for lit element to main DOM instead of the
 * default shadow root
 * 
 * @returns {Class} LitElement updated createRenderRoot function.
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