import { ApiDemoBase } from '@api-viewer/demo/lib/base.js';
import { setTemplates } from '@api-viewer/common/lib/templates.js';
import { getKnobs } from '@api-viewer/demo/lib/ui/knobs.js';
import { render, styles } from "./cork-theme-element-demo.tpl.js";

// Field types that get a knob. Fields of any other type (objects, arrays, controllers) are passed to api-demo's exclude-knobs.
const KNOB_TYPES = ['boolean', 'string', 'number'];

/**
 * @class CorkThemeElementDemo
 * @description Live playground for a theme element on the docs site, built on api-viewer's ApiDemoBase and driven by the package's
 * Custom Elements Manifest. Adds a markup panel in place of api-demo's Source tab, which shows the element's snippet and can be
 * edited as HTML, like a browser's dev tools. Applying an edit rebuilds the element, and the knobs follow its new property values.
 * The theme's CSS is included in the shadow root, so demo markup is styled as it would be on a page.
 *
 * @property {String} markup - Starting markup for the demo: the element itself, with its attributes and children.
 * @property {String[]} hiddenKnobs - Names of properties to leave out of the knobs, on top of those that aren't a primitive type.
 * @property {String} background - CSS background of the area the demo element is rendered in, e.g. 'var(--ucd-blue)' for an element
 * that sits on a blue header. Default: '', the theme's white.
 * @property {Object} manifest - The Custom Elements Manifest. From api-viewer's ManifestMixin.
 * @property {Array} only - Tag names to include from the manifest. From api-viewer's ManifestMixin.
 * @property {String} selected - Tag name of the element to demo. From api-viewer's ManifestMixin.
 */
export default class CorkThemeElementDemo extends ApiDemoBase {

  static get properties() {
    return {
      markup: {type: String},
      hiddenKnobs: {type: Array, attribute: false},
      background: {type: String},
      _editing: {state: true},
      _draft: {state: true},
      _error: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.markup = '';
    this.hiddenKnobs = [];
    this.background = '';
    this._editing = false;
    this._draft = '';
    this._error = '';
    this._appliedMarkup = '';

    // renderSnippet reads this instance's templates on the first render
    this.setTemplates([]);

    this._onKnobChange = this._onKnobChange.bind(this);
    this._onRendered = this._onRendered.bind(this);
  }

  /**
   * @method connectedCallback
   * @description Listens for knob changes and demo renders, which change the snippet.
   */
  connectedCallback() {
    super.connectedCallback();
    this.renderRoot.addEventListener('change', this._onKnobChange);
    this.renderRoot.addEventListener('rendered', this._onRendered);
  }

  /**
   * @method disconnectedCallback
   * @description Removes the listeners added in connectedCallback.
   */
  disconnectedCallback() {
    this.renderRoot.removeEventListener('change', this._onKnobChange);
    this.renderRoot.removeEventListener('rendered', this._onRendered);
    super.disconnectedCallback();
  }

  /**
   * @method willUpdate
   * @description Excludes non-primitive fields from the knobs, sets the demo area's background, and applies new starting markup.
   * @param {Map} props - Changed properties.
   */
  willUpdate(props) {
    if ( props.has('manifest') || props.has('selected') || props.has('hiddenKnobs') ) {
      this.excludeKnobs = this._getExcludedKnobs().join(',');
    }
    if ( props.has('background') ) {
      if ( this.background ) this.style.setProperty('--cork-demo-output-background', this.background);
      else this.style.removeProperty('--cork-demo-output-background');
    }
    if ( props.has('markup') ) {
      this._editing = false;
      this._applyMarkup(this.markup);
    }
    super.willUpdate(props);
  }

  /**
   * @method setTemplates
   * @description Registers this instance's demo templates with api-viewer, as api-demo does.
   * @param {HTMLTemplateElement[]} templates - Templates with data-element and data-target attributes. Defaults to the element's template children.
   */
  setTemplates(templates) {
    setTemplates(this._id, templates || Array.from(this.querySelectorAll('template')));
  }

  /**
   * @method getLayout
   * @description Gets api-demo's layout element, which renders the demo and the knobs.
   * @returns {HTMLElement|null}
   */
  getLayout() {
    return this.renderRoot?.querySelector('api-demo-layout') || null;
  }

  /**
   * @method getSnippetText
   * @description Gets the rendered snippet as plain text.
   * @returns {String}
   */
  getSnippetText() {
    return this.renderRoot.querySelector('[part="markup-snippet"] code')?.textContent || '';
  }

  /**
   * @method _getExcludedKnobs
   * @description Gets the names of the selected element's fields to leave out of the knobs: those that can't be set from a knob,
   * i.e. whose type isn't a primitive, and those in hiddenKnobs.
   * @returns {String[]}
   */
  _getExcludedKnobs() {
    const decl = (this.manifest?.modules || [])
      .flatMap(mod => mod.declarations || [])
      .find(d => d.customElement && d.tagName === this.selected);
    return (decl?.members || [])
      .filter(m => m.kind === 'field' && (!KNOB_TYPES.includes(m.type?.text) || this.hiddenKnobs.includes(m.name)))
      .map(m => m.name);
  }

  /**
   * @method _applyMarkup
   * @description Sets the demo's templates from markup, and rebuilds the demo element if it's already rendered.
   * The element's opening tag becomes the host template and its children the slot template.
   * @param {String} markup - The element's markup. Its first element must be the selected element.
   * @returns {Boolean} False if the markup couldn't be applied.
   */
  _applyMarkup(markup) {
    const parsed = document.createElement('template');
    parsed.innerHTML = markup || '';
    const el = parsed.content.firstElementChild;
    if ( !el || el.localName !== this.selected ) {
      this._error = `The markup must start with a <${this.selected}> element.`;
      return false;
    }
    this._error = '';

    const host = document.createElement('template');
    host.dataset.element = this.selected;
    host.dataset.target = 'host';
    host.content.appendChild(el.cloneNode(false));

    const slot = document.createElement('template');
    slot.dataset.element = this.selected;
    slot.dataset.target = 'slot';
    slot.innerHTML = el.innerHTML;

    // the renderer can't redraw unchanged markup, and there's nothing to redraw anyway
    const applied = host.innerHTML + slot.innerHTML;
    if ( applied === this._appliedMarkup ) return true;
    this._appliedMarkup = applied;
    this.setTemplates([host, slot]);

    const layout = this.getLayout();
    if ( !layout || layout.tag !== this.selected ) return true;

    // reset the knobs, so ones for removed attributes don't keep their old values, then let api-demo build the element again
    layout.knobs = {};
    layout.propKnobs = getKnobs(layout.props, layout.exclude);
    layout.querySelector(`[part="demo-output"] > ${this.selected}`)?.remove();
    layout.requestUpdate();
    return true;
  }

  /**
   * @method _hideSourceTab
   * @description Hides api-demo's Source tab, which the markup panel replaces, and selects the first visible tab.
   * Leaves it alone if it's the only visible tab.
   */
  _hideSourceTab() {
    const tabs = this.renderRoot.querySelector('[part="demo-tabs"]');
    const source = tabs?.querySelector('api-viewer-tab');
    if ( !source || source.hasAttribute('hidden') ) return;
    if ( !tabs.tabs.some(tab => tab !== source && !tab.hasAttribute('hidden')) ) return;
    source.setAttribute('hidden', '');
    // after the tabs' own first selection, which waits for an animation frame
    requestAnimationFrame(() => tabs.selectFirst());
  }

  /**
   * @method _onRendered
   * @description Called when api-demo has rendered the demo element. Hides the Source tab and redraws the snippet.
   */
  async _onRendered() {
    await this.getLayout()?.updateComplete;
    this._hideSourceTab();
    this.requestUpdate();
  }

  /**
   * @method _onKnobChange
   * @description Called when a knob changes. Redraws the snippet once api-demo has the new value.
   */
  async _onKnobChange() {
    await this.getLayout()?.updateComplete;
    this.requestUpdate();
  }

  /**
   * @method _onEditClick
   * @description Switches the markup panel to editing, starting from the current snippet.
   */
  _onEditClick() {
    this._draft = this.getSnippetText();
    this._error = '';
    this._editing = true;
  }

  /**
   * @method _onApplyClick
   * @description Applies the edited markup, and leaves editing if it worked.
   */
  _onApplyClick() {
    if ( this._applyMarkup(this._draft) ) this._editing = false;
  }

  /**
   * @method _onCancelClick
   * @description Leaves editing without applying anything.
   */
  _onCancelClick() {
    this._error = '';
    this._editing = false;
  }

  /**
   * @method _onCopyClick
   * @description Copies the snippet to the clipboard.
   */
  async _onCopyClick() {
    try {
      await navigator.clipboard.writeText(this.getSnippetText());
    } catch (e) {
      console.error('Could not copy the snippet', e);
    }
  }

}

customElements.define('cork-theme-element-demo', CorkThemeElementDemo);
