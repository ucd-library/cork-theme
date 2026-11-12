/**
 * @class PageWidthController
 * @description Sets the theme's page width CSS custom property (--page-width), and keeps it current as the window resizes.
 *
 * - With a Lit host, the controller starts and stops with the host's lifecycle.
 * - Without one, call init() to start it and destroy() to stop it.
 *
 * The property is set in a style tag (id cork-theme-page-width), one per root. Controllers on the same root share the tag,
 * and destroy() on any started one removes it.
 * 
 * The {@link cork-header} element sets the property by default, so you don't need to use this controller if you have a cork-header. 
 * @param {LitElement|Object} host - A Lit element to attach the controller to. Optional: pass opts as the first argument instead to use it standalone.
 * @param {Object} opts - Options.
 * @param {Document|ShadowRoot} opts.root - Where to add the style tag. Default: document.
 * @param {String} opts.selector - Selector the property is set on. Default: ':root', or ':host' if opts.root is a shadow root.
 * @param {String} opts.propertyName - Name of the property. Default: '--page-width'.
 * @param {Function} opts.shouldInit - With a host, called when the host connects. The controller only starts if it returns true. Default: always start.
 * @example <caption>Standalone</caption>
 * import { PageWidthController } from '@ucd-lib/cork-theme/utils/controllers';
 *
 * const pageWidth = new PageWidthController();
 * pageWidth.init();
 *
 * @example <caption>Lit host</caption>
 * // in a Lit element's constructor. Starts when the element connects, and stops when it disconnects.
 * this.ctl = { pageWidth: new PageWidthController(this) };
 *
 * // or only start while a property is off
 * this.ctl = { pageWidth: new PageWidthController(this, { shouldInit: () => !this.noPageWidth }) };
 *
 * @example <caption>Shadow root</caption>
 * // sets the property on the shadow root's host instead of the document
 * new PageWidthController(this, { root: this.renderRoot });
 */
export default class PageWidthController {

  constructor(host, opts={}){
    const isHost = typeof host?.addController === 'function';
    if ( !isHost ) opts = host || {};
    this.host = isHost ? host : null;
    this.root = opts.root || document;
    this.isShadowRoot = this.root instanceof ShadowRoot;
    this.selector = opts.selector || (this.isShadowRoot ? ':host' : ':root');
    this.propertyName = opts.propertyName || '--page-width';
    this.shouldInit = opts.shouldInit || (() => true);
    this.styleId = 'cork-theme-page-width';
    this._initialized = false;
    this._width = null;
    this._onResize = this._onResize.bind(this);

    if ( this.host ) this.host.addController(this);
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
   * @description Sets the property and starts listening for window resizes. Does nothing if already started.
   */
  init(){
    if ( this.isInitialized() ) return;
    this.setPageWidthProperty();
    window.addEventListener('resize', this._onResize);
    this._initialized = true;
  }

  /**
   * @description Checks if the controller has been started.
   * @returns {Boolean}
   */
  isInitialized(){
    return this._initialized;
  }

  /**
   * @description Stops listening for window resizes, and removes the property's style tag. Does nothing if not started,
   * so it can't remove a tag set by another controller.
   */
  destroy(){
    if ( !this.isInitialized() ) return;
    window.removeEventListener('resize', this._onResize);
    this.root.getElementById(this.styleId)?.remove();
    this._initialized = false;
  }

  /**
   * @description Gets the property's current value, as computed on the root's element (the document element, or the shadow root's host).
   * @returns {String} e.g. '1200px', or '' if not set.
   */
  getPageWidthProperty(){
    const ele = this.isShadowRoot ? this.root.host : this.root.documentElement;
    return getComputedStyle(ele).getPropertyValue(this.propertyName).trim();
  }

  /**
   * @description Sets the property to the document element's current width, which excludes any scrollbar.
   */
  setPageWidthProperty(){
    let style = this.root.getElementById(this.styleId);
    if ( !style ) {
      style = document.createElement('style');
      style.id = this.styleId;
      ( this.isShadowRoot ? this.root : this.root.head ).prepend(style);
    }
    this._width = document.documentElement.clientWidth;
    style.textContent = `${this.selector} {\n  ${this.propertyName}: ${this._width}px;\n}`;
  }

  /**
   * @description Listener for the window resize event. Updates the property if the width changed.
   * Height-only resizes, e.g. a mobile browser's URL bar showing or hiding on scroll, are skipped.
   */
  _onResize(){
    if ( document.documentElement.clientWidth === this._width ) return;
    this.setPageWidthProperty();
  }
}
