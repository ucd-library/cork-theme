import { ApiDemoBase } from '@api-viewer/demo/lib/base.js';
import { setTemplates } from '@api-viewer/common/lib/templates.js';
import { getKnobs, getCustomKnobs } from '@api-viewer/demo/lib/ui/knobs.js';
import { render, styles } from "./cork-theme-element-demo.tpl.js";

// Field types that get a property knob. Fields of any other type (objects, arrays) that have an attribute get an attribute knob instead.
const KNOB_TYPES = ['boolean', 'string', 'number'];

// Campus section backgrounds the demo can be shown on: the layout-section--<name> classes, with layout-section--force-contrast
const SECTION_BACKGROUNDS = [
  'primary', 'secondary', 'light-gray', 'dark-gray', 'arboretum', 'bodega', 'cabernet', 'delta', 'double-decker',
  'farmers-market', 'golden-state', 'gunrock', 'merlot', 'pinot', 'rain', 'rec-pool', 'rose', 'sage', 'thiebaud-icing', 'wonder-blue'
];

/**
 * @class CorkThemeElementDemo
 * @description Live playground for a theme element on the docs site, built on api-viewer's ApiDemoBase and driven by the package's
 * Custom Elements Manifest. Adds a markup panel in place of api-demo's Source tab, which shows the element's snippet and can be
 * edited as HTML, like a browser's dev tools. Applying an edit rebuilds the element, and the knobs follow its new property values.
 * Knobs also follow the element's attributes as it changes them itself, e.g. a reflected open property toggled by a click.
 * Property changes that don't reflect to an attribute can't be followed.
 * Only fields with an attribute get a knob, so Lit state and attribute: false properties have none. Fields with an attribute that
 * aren't a primitive type, e.g. cork-pager's queryParams (query-params), get a text knob under Attributes, which sets the attribute.
 * The theme's CSS is included in the shadow root, so demo markup is styled as it would be on a page.
 * With backgroundMenu, a Background menu above the demo shows the element inside a campus section background (layout-section--<name>
 * with layout-section--force-contrast), which passes --forced-contrast and related custom properties down to it, as a real section would.
 *
 * @property {String} markup - Starting markup for the demo: the element itself, with its attributes and children.
 * @property {String[]} hiddenKnobs - Names of properties to leave out of the knobs, on top of those without an attribute.
 * Also hides a property's attribute knob.
 * @property {String} background - CSS background of the area the demo element is rendered in, e.g. 'var(--ucd-blue)' for an element
 * that sits on a blue header. Default: '', the theme's white.
 * @property {Boolean} backgroundMenu - Shows the Background menu of campus section backgrounds above the demo. Default: false
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
      backgroundMenu: {type: Boolean},
      _editing: {state: true},
      _draft: {state: true},
      _error: {state: true},
      _sectionBackground: {state: true}
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
    this.backgroundMenu = false;
    this._sectionBackground = '';
    this.sectionBackgrounds = SECTION_BACKGROUNDS;
    this._appliedMarkup = '';
    this._hostAttributes = [];

    // renderSnippet reads this instance's templates on the first render
    this.setTemplates([]);

    this._onKnobChange = this._onKnobChange.bind(this);
    this._onRendered = this._onRendered.bind(this);
    this._attributeObserver = new MutationObserver(this._onComponentAttributeChange.bind(this));
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
    this._attributeObserver.disconnect();
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
    if ( props.has('backgroundMenu') && !this.backgroundMenu ) {
      this._sectionBackground = '';
      this._applySectionBackground();
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
   * @method getSnippetValues
   * @description Gets the values to render the snippet from: the layout's knobs, plus the attributes in the markup that no knob controls,
   * e.g. class or id. api-viewer's snippet only shows knobs, so those attributes would otherwise be left out.
   * @returns {Object} Values keyed by name, in the shape of the layout's knobs: { value, knobType, attribute }.
   */
  getSnippetValues() {
    const layout = this.getLayout();
    const values = { ...(layout?.knobs || {}) };
    const knobAttributes = new Set([...(layout?.propKnobs || []), ...(layout?.customKnobs || [])].map(knob => knob.attribute));
    for ( const { name, value } of this._hostAttributes ) {
      if ( knobAttributes.has(name) || values[name] ) continue;
      // an attribute with no value, e.g. hidden, is written bare
      values[name] = value === '' ? { value: true, knobType: 'boolean', attribute: name } : { value, knobType: 'string', attribute: name };
    }
    return values;
  }

  /**
   * @method _getExcludedKnobs
   * @description Gets the names of the selected element's fields to leave out of the property knobs: those without an attribute
   * (Lit state and attribute: false properties), those whose type isn't a primitive (see _getAttributeKnobTemplates), and those in hiddenKnobs.
   * @returns {String[]}
   */
  _getExcludedKnobs() {
    return (this._getDeclaration()?.members || [])
      .filter(m => m.kind === 'field' && (!m.attribute || !KNOB_TYPES.includes(m.type?.text) || this.hiddenKnobs.includes(m.name)))
      .map(m => m.name);
  }

  /**
   * @method _getDeclaration
   * @description Gets the selected element's declaration from the manifest.
   * @returns {Object|undefined}
   */
  _getDeclaration() {
    return (this.manifest?.modules || [])
      .flatMap(mod => mod.declarations || [])
      .find(d => d.customElement && d.tagName === this.selected);
  }

  /**
   * @method _getAttributeKnobTemplates
   * @description Gets api-viewer custom knob templates for the selected element's fields that aren't a primitive type but have an attribute,
   * so they can be set as a string attribute, e.g. cork-pager's query-params. Leaves out fields in hiddenKnobs.
   * @returns {HTMLTemplateElement[]}
   */
  _getAttributeKnobTemplates() {
    return (this._getDeclaration()?.members || [])
      .filter(m => m.kind === 'field' && m.attribute && !KNOB_TYPES.includes(m.type?.text) && !this.hiddenKnobs.includes(m.name))
      .map(m => {
        const knob = document.createElement('template');
        knob.dataset.element = this.selected;
        knob.dataset.target = 'knob';
        knob.dataset.attr = m.attribute;
        knob.dataset.type = 'string';
        return knob;
      });
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
    this._hostAttributes = Array.from(el.attributes).map(attr => ({ name: attr.name, value: attr.value }));
    this.setTemplates([host, slot, ...this._getAttributeKnobTemplates()]);

    const layout = this.getLayout();
    if ( !layout || layout.tag !== this.selected ) return true;

    // reset the knobs, so ones for removed attributes don't keep their old values, then let api-demo build the element again
    layout.knobs = {};
    layout.propKnobs = getKnobs(layout.props, layout.exclude);
    layout.customKnobs = getCustomKnobs(layout.tag, layout.vid);
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
   * @description Called when api-demo has rendered the demo element. Fills the attribute knobs from the element's attributes,
   * which api-demo only does for property knobs, and watches the element's attributes to keep the knobs in sync.
   * Then hides the Source tab and redraws the snippet.
   * @param {CustomEvent} e - api-demo's rendered event. detail.component is the demo element.
   */
  async _onRendered(e) {
    const layout = this.getLayout();
    const component = e.detail?.component;
    this._attributeObserver.disconnect();
    if ( layout && component ) {
      this._attributeObserver.observe(component, { attributes: true });
      this._addLayoutController(layout);
      layout.customKnobs = layout.customKnobs.map(knob => {
        const value = component.getAttribute(knob.attribute);
        if ( value === null ) return knob;
        layout.setKnobs(knob.name, knob.knobType, value, knob.attribute, true);
        return { ...knob, value };
      });
    }
    await layout?.updateComplete;
    this._applySectionBackground();
    this._hideSourceTab();
    this.requestUpdate();
  }

  /**
   * @method _addLayoutController
   * @description Adds a controller to api-demo's layout, once per layout, that syncs the knobs with the demo element's pending
   * attribute changes before each layout render. The layout's renderer sets every knob's value on the element when it renders,
   * and an event from the element (logged by the layout) can make it render before the attribute observer's callback runs,
   * which would put back the element's old value.
   * @param {HTMLElement} layout - api-demo's layout element.
   */
  _addLayoutController(layout) {
    if ( this._controlledLayout === layout ) return;
    this._controlledLayout = layout;
    layout.addController({
      hostUpdate: () => {
        const records = this._attributeObserver.takeRecords();
        if ( records.length ) this._onComponentAttributeChange(records);
      }
    });
  }

  /**
   * @method _onComponentAttributeChange
   * @description Called when the demo element's attributes change, e.g. when it reflects a property it changed itself.
   * Updates the matching property or attribute knobs, which api-demo never reads back from the element, then redraws the snippet.
   * @param {MutationRecord[]} records - The attribute mutations.
   */
  _onComponentAttributeChange(records) {
    const layout = this.getLayout();
    const component = records[0]?.target;
    if ( !layout || !component ) return;
    const attributes = new Set(records.map(r => r.attributeName));
    let changed = false;

    for ( const knob of layout.propKnobs ) {
      if ( !attributes.has(knob.attribute) ) continue;
      layout.syncKnob(component, knob);
      this._setKnobInput(knob.name, component[knob.name]);
      changed = true;
    }
    layout.customKnobs = layout.customKnobs.map(knob => {
      if ( !attributes.has(knob.attribute) ) return knob;
      const value = component.getAttribute(knob.attribute) ?? '';
      layout.setKnobs(knob.name, knob.knobType, value, knob.attribute, true);
      this._setKnobInput(knob.name, value);
      changed = true;
      return { ...knob, value };
    });

    if ( changed ) this._onKnobChange();
  }

  /**
   * @method _setKnobInput
   * @description Sets a knob's input to a value. api-demo binds knob inputs with Lit's .checked and .value, which skip values
   * equal to the last ones rendered, so an input the user has since changed by hand would otherwise keep its stale value.
   * @param {String} name - The knob's name: its data-name.
   * @param {*} value - The value. Booleans set a checkbox; anything else sets a text or number input.
   */
  _setKnobInput(name, value) {
    const input = this.getLayout()?.querySelector(`[part="knobs-column"] [data-name="${CSS.escape(name)}"]`);
    if ( !input ) return;
    if ( input.type === 'checkbox' ) input.checked = Boolean(value);
    else input.value = value == null ? '' : String(value);
  }

  /**
   * @method _applySectionBackground
   * @description Puts the chosen campus section background classes on api-demo's output area, the demo element's parent,
   * replacing any from before. With none chosen, the output area uses the background property.
   */
  _applySectionBackground() {
    const output = this.getLayout()?.querySelector('[part="demo-output"]');
    if ( !output ) return;
    output.classList.remove(...Array.from(output.classList).filter(c => c.startsWith('layout-section--')));
    if ( this._sectionBackground ) {
      output.classList.add(`layout-section--${this._sectionBackground}`, 'layout-section--force-contrast');
    }
  }

  /**
   * @method _onSectionBackgroundChange
   * @description Called when the Background menu changes. Applies the chosen section background.
   * @param {Event} e - The select's change event.
   */
  _onSectionBackgroundChange(e) {
    e.stopPropagation();
    this._sectionBackground = e.target.value;
    this._applySectionBackground();
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
