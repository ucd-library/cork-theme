import { render, styles } from "./cork-nav-sub-popover.tpl.js";

import CorkNavSub from '@ucd-lib/cork-theme/elements/cork-nav-sub/cork-nav-sub.js';
import { AppStateController, PopoverController } from '@ucd-lib/cork-theme/utils/controllers';

/**
 * @description A sub menu in a popover: a full-width button that opens a tray with the title and drill-down of a {@link CorkNavSub}.
 * Takes the same light DOM as cork-nav-sub. The drill-down always uses auto height.
 *
 * The browser closes the tray when the user clicks outside it or presses Escape (after any open submenus are closed), and returns focus to the button.
 * In a SPA using @ucd-lib/cork-app-state, the tray also closes when the location changes, with an {@link AppStateController}.
 * Set the no-app-state-close attribute to turn this off. In any other SPA, call hide() from your router on navigation.
 * @property {String} buttonLabel - The button's text. Default: 'Submenu'. Attribute: button-label.
 * @property {Boolean} headingLabel - Uses the title's text as the button's text, if there is a title. Attribute: heading-label.
 * @property {Boolean} hideHeading - Leaves the title out of the tray. Attribute: hide-heading.
 * @property {Boolean} noAppStateClose - Stops the tray from closing on cork-app-state location changes. Attribute: no-app-state-close.
 * @property {String} navAriaLabel - Label for the nav. Default: the title's text, or 'Submenu' if there's no title. Attribute: nav-aria-label.
 * @property {Number[]} focusedNavItem - navPosition of the focused item, e.g. [1, 0]. Attribute: focused-nav-item, comma-separated (e.g. "1,0").
 * @property {Boolean} isOpen - Whether the tray is open. Read only.
 * @slot - Title and menu, as in cork-nav-sub. Not an actual slot, but rather parsed and rendered into the shadow DOM by controllers.
 * The title is an h1-h6, or a div/span with the data-heading attribute (optionally a level, e.g. data-heading="h2", for that level's look), optionally wrapping a link or button. See {@link HeadingController}.
 * The menu is a ul/ol of li elements, nested for sub menus. See {@link NavController} for the markup formats.
 * @event cork-popover-toggle - Fired when the tray opens or closes, with detail.open. See {@link PopoverController}.
 * @event cork-nav-item-click - Fired when a rendered menu link or button is clicked, with the clicked item in detail.navItem. See {@link NavController}.
 * @event cork-heading-click - Fired when a linked title is clicked, with the title in detail.heading. See {@link HeadingController}.
 * @example <caption>Import</caption>
 * import '@ucd-lib/cork-theme/elements/cork-nav-sub-popover';
 *
 * // or the class only, without registering the element:
 * import CorkNavSubPopover from '@ucd-lib/cork-theme/elements/cork-nav-sub-popover/cork-nav-sub-popover.js';
 *
 * @example <caption>Use</caption>
 * <cork-nav-sub-popover button-label="In this section">
 *   <h2><a href="/services">Services</a></h2>
 *   <ul>
 *     <li><a href="/services/borrow">Borrowing</a></li>
 *     <li><button>Printing</button></li>
 *   </ul>
 * </cork-nav-sub-popover>
 *
 * @example <caption>Title as the button's text</caption>
 * <!-- the button says "Services", and the title isn't repeated in the tray -->
 * <cork-nav-sub-popover heading-label hide-heading>
 *   <h2>Services</h2>
 *   <ul>…</ul>
 * </cork-nav-sub-popover>
 *
 * @example <caption>Opening and closing from code</caption>
 * const popover = document.querySelector('cork-nav-sub-popover');
 * popover.show();
 * popover.hide();
 * popover.addEventListener('cork-popover-toggle', e => console.log(e.detail.open));
 */
export default class CorkNavSubPopover extends CorkNavSub {

  static get properties() {
    return {
      buttonLabel: { type: String, attribute: 'button-label' },
      headingLabel: { type: Boolean, attribute: 'heading-label' },
      hideHeading: { type: Boolean, attribute: 'hide-heading' },
      noAppStateClose: { type: Boolean, attribute: 'no-app-state-close' }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.autoHeight = true;
    this.buttonLabel = 'Submenu';
    this.headingLabel = false;
    this.hideHeading = false;
    this.noAppStateClose = false;

    this.ctl.popover = new PopoverController(this);
    this.ctl.appState = new AppStateController(this, { shouldInit: () => !this.noAppStateClose });
  }

  /**
   * @description Standard Lit lifecycle method. Starts or stops closing on app state location changes, when noAppStateClose changes.
   * @param {Map} props - Map of changed properties and their previous values
   */
  willUpdate(props){
    super.willUpdate?.(props);
    if ( props.has('noAppStateClose') ) {
      this.noAppStateClose ? this.ctl.appState.destroy() : this.ctl.appState.init();
    }
  }

  /**
   * @description Whether the tray is open.
   * @returns {Boolean}
   */
  get isOpen(){
    return this.ctl.popover.isOpen;
  }

  /**
   * @description Opens the tray.
   */
  show(){
    this.ctl.popover.show();
  }

  /**
   * @description Closes the tray. Call it from an SPA's router on navigation, unless the app uses cork-app-state.
   */
  hide(){
    this.ctl.popover.hide();
  }

  /**
   * @description Opens the tray if it's closed, or closes it if it's open.
   */
  toggle(){
    this.ctl.popover.toggle();
  }

  /**
   * @description The button's text: the title's text if headingLabel is set and there's a title, or else buttonLabel.
   * @returns {String}
   */
  get _buttonLabel(){
    return (this.headingLabel && this.ctl.heading.heading?.title) || this.buttonLabel;
  }

  /**
   * @description Callback for the AppStateController. Closes the tray when the app state's location changes,
   * and ignores other app state updates.
   * @param {Object} state - The cork-app-state app state.
   */
  _onAppStateUpdate(state){
    const fullpath = state?.location?.fullpath;
    if ( fullpath === this._lastFullpath ) return;
    this._lastFullpath = fullpath;
    this.hide();
  }

  /**
   * @description Registers the element as a custom element.
   * @param {String} tagName - Tag name to register. Default: 'cork-nav-sub-popover'
   */
  static define(tagName='cork-nav-sub-popover'){
    if ( !customElements.get(tagName) ) customElements.define(tagName, this);
  }

}
