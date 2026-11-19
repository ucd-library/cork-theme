// Elements that can take focus, for moving focus into an opened popover
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * @class PopoverController
 * @classdesc Lit controller that wires up a button and a popover, using the native Popover API.
 * The host's template puts the controller's buttonRef and popoverRef on two of its rendered elements, and the controller does the rest:
 *
 * - Adds the popover attribute to the popover element (opts.type), unless the template already sets it.
 * - Links the button to the popover with popoverTargetElement, so no ids are needed.
 * - Moves focus to the popover's first focusable element when it opens.
 * - Fires cork-popover-toggle from the host when the popover opens or closes.
 *
 * The browser handles the rest: opening and closing on button clicks, light dismiss (clicking outside or pressing Escape),
 * returning focus to the button, and the button's ARIA state.
 *
 * @property {LitElement} host - 'this' from a Lit element
 * @property {String} type - The popover attribute's value, if the controller adds it.
 * @property {Boolean} focusOnOpen - Whether focus moves to the popover's first focusable element when it opens.
 * @property {Function} buttonRef - Ref callback for the button that toggles the popover. Use with Lit's ref directive.
 * @property {Function} popoverRef - Ref callback for the popover element. Use with Lit's ref directive.
 * @property {HTMLElement|null} buttonEle - The button, once rendered.
 * @property {HTMLElement|null} popoverEle - The popover element, once rendered.
 * @property {Boolean} isOpen - Whether the popover is open.
 *
 * @event cork-popover-toggle - Fired from the host when the popover opens or closes. Bubbles and is composed.
 *
 * - detail.open: whether the popover is now open.
 * - detail.originalEvent: the native toggle event.
 *
 * @example <caption>Instantiation</caption>
 * import { PopoverController } from '@ucd-lib/cork-theme/utils/controllers';
 *
 * // in the host element's constructor
 * this.ctl = { popover: new PopoverController(this) };
 * // or a manual popover (no light dismiss), that leaves focus on the button when it opens
 * this.ctl = { popover: new PopoverController(this, { type: 'manual', focusOnOpen: false }) };
 *
 * @example <caption>Rendering</caption>
 * // in your element template
 * import { ref } from 'lit/directives/ref.js';
 *
 * html`
 *   <button ${ref(this.ctl.popover.buttonRef)}>Filters</button>
 *   <div ${ref(this.ctl.popover.popoverRef)}>
 *     <label><input type="checkbox"> Open now</label>
 *   </div>
 * `;
 *
 * @example <caption>Opening and closing from code</caption>
 * this.ctl.popover.show();
 * this.ctl.popover.hide();
 * this.ctl.popover.toggle();
 * if ( this.ctl.popover.isOpen ) { ... }
 *
 * @example <caption>Listening for changes</caption>
 * myElement.addEventListener('cork-popover-toggle', e => console.log(e.detail.open));
 */
export default class PopoverController {

  /**
   * @param {LitElement} host - 'this' from a Lit element
   * @param {Object} opts - Options.
   * @param {String} opts.type - Value for the popover attribute, if the template doesn't set it: 'auto', 'manual' or 'hint'. Default: 'auto'
   * @param {Boolean} opts.focusOnOpen - Move focus to the popover's first focusable element when it opens. Default: true
   */
  constructor(host, opts={}){
    this.host = host;
    this.type = opts.type || 'auto';
    this.focusOnOpen = opts.focusOnOpen ?? true;

    this.buttonEle = null;
    this.popoverEle = null;
    this._listeningEle = null;

    this.buttonRef = this.buttonRef.bind(this);
    this.popoverRef = this.popoverRef.bind(this);
    this._onToggle = this._onToggle.bind(this);

    host.addController(this);
  }

  /**
   * @description Ref callback for the button. Use as ${ref(this.ctl.popover.buttonRef)}.
   * @param {HTMLElement|undefined} ele - The button, or undefined when it's removed.
   */
  buttonRef(ele){
    this.buttonEle = ele || null;
  }

  /**
   * @description Ref callback for the popover element. Use as ${ref(this.ctl.popover.popoverRef)}.
   * Adds the popover attribute straight away, while the template is committed and before paint, so the element is never shown unhidden.
   * @param {HTMLElement|undefined} ele - The popover element, or undefined when it's removed.
   */
  popoverRef(ele){
    this.popoverEle = ele || null;
    if ( ele && !ele.hasAttribute('popover') ) ele.popover = this.type;
  }

  /**
   * @description Whether the popover is open.
   * @returns {Boolean}
   */
  get isOpen(){
    return this.popoverEle?.matches(':popover-open') || false;
  }

  /**
   * @description Opens the popover. Does nothing if it's open, or not rendered yet.
   */
  show(){
    if ( !this.popoverEle || this.isOpen ) return;
    this.popoverEle.showPopover({ source: this.buttonEle || undefined });
  }

  /**
   * @description Closes the popover. Does nothing if it's closed, or not rendered yet.
   */
  hide(){
    if ( !this.popoverEle || !this.isOpen ) return;
    this.popoverEle.hidePopover();
  }

  /**
   * @description Opens the popover if it's closed, or closes it if it's open.
   */
  toggle(){
    this.isOpen ? this.hide() : this.show();
  }

  /**
   * @description Lit controller lifecycle method. Links the button to the popover, and listens for the popover's toggle event,
   * moving the listener if the popover element has changed.
   */
  hostUpdated(){
    if ( this.buttonEle && this.buttonEle.popoverTargetElement !== this.popoverEle ) {
      this.buttonEle.popoverTargetElement = this.popoverEle;
    }
    if ( this._listeningEle !== this.popoverEle ) {
      this._stopListening();
      this.popoverEle?.addEventListener('toggle', this._onToggle);
      this._listeningEle = this.popoverEle;
    }
  }

  /**
   * @description Lit controller lifecycle method. Listens for the popover's toggle event again, if the host reconnects.
   */
  hostConnected(){
    if ( this.host.hasUpdated ) this.hostUpdated();
  }

  /**
   * @description Lit controller lifecycle method. Stops listening for the popover's toggle event.
   */
  hostDisconnected(){
    this._stopListening();
  }

  /**
   * @description Removes the toggle listener from the element that has it, if any.
   */
  _stopListening(){
    this._listeningEle?.removeEventListener('toggle', this._onToggle);
    this._listeningEle = null;
  }

  /**
   * @description Listener for the popover's native toggle event. Moves focus into the popover when it opens (if focusOnOpen is set),
   * and fires cork-popover-toggle from the host.
   * @param {ToggleEvent} e - The toggle event.
   */
  _onToggle(e){
    const open = e.newState === 'open';
    if ( open && this.focusOnOpen ) this._getFirstFocusable(this.popoverEle)?.focus();

    this.host.dispatchEvent(new CustomEvent('cork-popover-toggle', {
      detail: { open, originalEvent: e },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * @description Gets the first focusable element in an element, skipping ones that aren't displayed.
   * @param {HTMLElement} root - The element to look in.
   * @returns {HTMLElement|undefined}
   */
  _getFirstFocusable(root){
    if ( !root ) return;
    return [...root.querySelectorAll(FOCUSABLE)].find(ele => ele.getClientRects().length);
  }

}
