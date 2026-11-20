import { html } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ref } from 'lit/directives/ref.js';

import MutationObserverController from './MutationObserverController.js';

import headingsCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_headings.css.js';
import headingClassesCss from '@ucd-lib/cork-theme/styles/js/ucdlib-sass/_heading-classes.css.js';

// Tags a heading can be rendered as
const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p'];

// Values of the heading attribute that style a non-heading like a heading level, with the .h1-.h6 classes
const HEADING_CLASSES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * @typedef {Object} Heading
 * @description Used by the HeadingController to represent a heading parsed from the host's light DOM.
 * @property {String} tag - Tag name of the light DOM heading, e.g. 'h2', or 'div' for <div data-heading>.
 * @property {String|null} headingClass - The heading attribute's value if it's h1-h6, e.g. 'h2' for <div data-heading="h2">, or null.
 * Added to the rendered element's classes, to style it like that heading level.
 * @property {String} title - The heading's text: from its link/button, or its own text.
 * @property {String|null} href - The link's href as written in the markup, or null.
 * @property {String|null} target - The link's target attribute, or null.
 * @property {Boolean} disabled - Whether the link/button has the disabled attribute.
 * @property {String|null} ariaLabel - The aria-label attribute of the link/button, or null.
 * @property {HTMLElement|null} ele - The light DOM link/button that supplied the title, or null.
 * @property {HTMLElement} headingEle - The light DOM heading element.
 * @property {Function} click - Click listener for the heading's shadow DOM button or link. Wired up by heading.render. Takes the click event.
 *
 * - Fires cork-heading-click from the host, with the heading and the click event.
 * - For a button, then passes the click through to the light DOM button, so its listeners run.
 * - Links aren't passed through: they rely on their shadow DOM href, so listeners on a light DOM link don't run. Use cork-heading-click instead.
 * @property {Function} render - Renders the heading for the host's shadow DOM, e.g. ${heading.render({classes: 'title'})}.
 * Takes the same opts as the controller's render, or just a class string.
 * @property {Object} renderedEles - The heading's elements in the host's shadow DOM, set when they render. Empty until then.
 * @property {HTMLElement} [renderedEles.heading] - The rendered heading (or div/span) element.
 * @property {HTMLElement} [renderedEles.item] - The rendered link or button, if any.
 */

/**
 * @class HeadingController
 * @classdesc Lit controller that parses a heading in the host's light DOM, for the host element to render in its shadow DOM.
 * The heading is the host's first direct child that is an h1-h6, or that has the heading attribute (e.g. a div or span that shouldn't be a heading).
 * It's rendered with the same tag, and its text can be wrapped in a link or button.
 * The heading attribute can take a heading level, h1-h6, which adds the matching .h1-.h6 class, so a non-heading looks like that level.
 * Include HeadingController.styles in the host's styles for the h1-h6 and .h1-.h6 styles.
 *
 * @property {LitElement} host - 'this' from a Lit element
 * @property {String} headingAttribute - Attribute that marks a non-heading element as the heading. Default: 'data-heading'
 * @property {Heading|null} heading - The parsed heading, or null if the host has none.
 *
 * @event cork-heading-update - Fired when the parsed heading changes including the first parse on host connection, if the host has a heading. 
 * Bubbles and is composed. detail.heading: the heading, or null if it was removed.
 * @event cork-heading-click - Fired from the host when the heading's rendered button or link is clicked (see Heading's click). Bubbles and is composed.
 *
 * - detail.heading: the heading.
 * - detail.originalEvent: the click event, e.g. to call preventDefault() on a link for an SPA router.
 *
 * @example <caption>Instantiation</caption>
 * import { HeadingController } from '@ucd-lib/cork-theme/utils/controllers';
 *
 * // in the host element's constructor
 * this.ctl = { heading: new HeadingController(this) };
 * // or with a different heading attribute
 * this.ctl = { heading: new HeadingController(this, { headingAttribute: 'data-cork-heading' }) };
 *
 * @example <caption>Rendering</caption>
 * <!-- in your element template. Renders nothing if the host has no heading -->
 * ${this.ctl.heading.render({ classes: 'panel__title' })}
 *
 * <!-- or assign classes by content type, and override the tag -->
 * ${this.ctl.heading.render({ tag: 'h3', typeClasses: { a: 'title-linked', button: 'title-linked', text: 'title' } })}
 *
 * <!-- or always render a button, e.g. for a disclosure that toggles an element with id="content" -->
 * ${this.ctl.heading.render({ button: true, ariaExpanded: String(this.open), ariaControls: 'content' })}
 *
 * @example <caption>Light DOM markup - heading</caption>
 * <my-element>
 *   <h2>Services</h2>
 * </my-element>
 *
 * <my-element>
 *   <h2><a href="/services">Services</a></h2>
 * </my-element>
 *
 * <my-element>
 *   <h3><button>Services</button></h3>
 * </my-element>
 *
 * @example <caption>Light DOM markup - not a heading</caption>
 * <my-element>
 *   <div data-heading>Services</div>
 * </my-element>
 *
 * <!-- styled like an h2, with the .h2 class -->
 * <my-element>
 *   <div data-heading="h2">Services</div>
 * </my-element>
 *
 * @example <caption>Styles</caption>
 * // in the host element's styles
 * return [...HeadingController.styles, elementStyles];
 */
export default class HeadingController {

  /**
   * @param {LitElement} host - 'this' from a Lit element
   * @param {Object} opts - Options.
   * @param {String} opts.headingAttribute - Attribute that marks a non-heading element as the heading. Default: 'data-heading'
   */
  constructor(host, opts={}){
    this.host = host;
    this.headingAttribute = opts.headingAttribute || 'data-heading';
    this.heading = null;

    host.addController(this);

    this.mutationObserver = new MutationObserverController(
      this.host,
      {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [this.headingAttribute, 'href', 'target', 'disabled', 'aria-label']
      },
      this._onMutation.bind(this)
    );
  }

  /**
   * @description Styles for rendered headings: the h1-h6 elements, and the .h1-.h6 classes added by the heading attribute's value.
   * @returns {Array} Lit css results.
   */
  static get styles() {
    return [headingsCss, headingClassesCss];
  }

  /**
   * @description Renders the heading for the host's shadow DOM, or nothing if the host has none.
   * The heading's text is wrapped in a link or button if it has one, with clicks wired up to heading.click.
   * @param {Object|String} opts - Options. A string is treated as opts.classes.
   * @param {String|Object} opts.classes - Classes for the heading element: a space-separated string, or a classMap object.
   * Added to heading.headingClass, if it has one.
   * @param {Object} opts.typeClasses - Classes for the heading element by content type, added to opts.classes.
   * Keys: a, button, text. Each value is a string or classMap object, e.g. { a: 'nav-sub__title-linked', text: 'nav-sub__title' }
   * @param {String|Object} opts.linkClasses - Classes for the link or button inside the heading.
   * @param {String} opts.tag - Tag to render instead of the light DOM heading's: h1-h6, div, span, or p. Others are ignored.
   * @param {Boolean} opts.button - Always wraps the heading's text in a button, even if the light DOM heading has no button, or has a link.
   * Clicks still go through heading.click, which only passes them on to a light DOM button.
   * @param {String} opts.ariaExpanded - aria-expanded for the rendered button, e.g. for a disclosure. Only set on buttons.
   * @param {String} opts.ariaControls - aria-controls for the rendered button: the id of an element in the host's shadow DOM. Only set on buttons.
   * @returns {TemplateResult|String}
   */
  render(opts={}){
    return this.heading ? this.heading.render(opts) : '';
  }

  /**
   * @description Callback for MutationObserverController. Also runs when the host connects.
   * Re-parses the light DOM. If the heading changed, replaces it, requests a host update, and fires cork-heading-update.
   * Otherwise keeps the current heading object, so its renderedEles stay set.
   */
  _onMutation(){
    const heading = this.parse();
    if ( this._isSameHeading(heading, this.heading) ) return;
    this.heading = heading;
    this.host.requestUpdate();
    this.host.dispatchEvent(new CustomEvent('cork-heading-update', {
      detail: { heading: this.heading },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * @description Parses the host's heading: its first direct child that is an h1-h6 or has the heading attribute.
   * @returns {Heading|null}
   */
  parse(){
    const selector = `h1, h2, h3, h4, h5, h6, [${this.headingAttribute}]`;
    const headingEle = Array.from(this.host.children).find(child => child.matches(selector));
    if ( !headingEle ) return null;

    const ele = Array.from(headingEle.children).find(child => child.matches('a, button')) || null;
    const props = {
      tag: headingEle.localName,
      headingClass: HEADING_CLASSES.includes(headingEle.getAttribute(this.headingAttribute)) ? headingEle.getAttribute(this.headingAttribute) : null,
      title: this._cleanText(ele ? ele.textContent : headingEle.textContent),
      href: null,
      target: null,
      disabled: false,
      ariaLabel: null,
      ele,
      headingEle
    };
    if ( ele ) {
      props.href = ele.getAttribute('href');
      props.target = ele.getAttribute('target');
      props.disabled = ele.hasAttribute('disabled');
      props.ariaLabel = ele.getAttribute('aria-label');
    }
    if ( !props.title ) return null;
    return this._makeHeading(props);
  }

  /**
   * @description Makes a heading object from its properties, and adds its functions.
   * @param {Object} props - Properties of the heading.
   * @returns {Heading}
   */
  _makeHeading(props){
    const heading = { ...props, renderedEles: {} };
    // Fires cork-heading-click, then passes a button click through to the light DOM button.
    // Links aren't passed through, so clicks keep their native behavior
    heading.click = (e) => {
      this.host.dispatchEvent(new CustomEvent('cork-heading-click', {
        bubbles: true,
        composed: true,
        detail: { heading, originalEvent: e }
      }));
      if ( !heading.ele?.matches('button') ) return;
      heading.ele.click();
    };
    heading.render = (opts={}) => this._renderHeading(heading, opts);
    return heading;
  }

  /**
   * @description Renders a heading, and records its elements in heading.renderedEles. Called by heading.render.
   * @param {Heading} heading - The heading.
   * @param {Object|String} opts - Options. See render.
   * @returns {TemplateResult}
   */
  _renderHeading(heading, opts={}){
    if ( typeof opts === 'string' ) opts = { classes: opts };
    const contentType = opts.button || heading.ele?.matches('button') ? 'button' : heading.href ? 'a' : 'text';
    const tag = unsafeStatic(TAGS.includes(opts.tag) ? opts.tag : (TAGS.includes(heading.tag) ? heading.tag : 'div'));

    const headingClasses = toClassAttribute([heading.headingClass, opts.classes, opts.typeClasses?.[contentType]]);
    const linkClasses = toClassAttribute([opts.linkClasses]);
    const ariaLabel = ifDefined(heading.ariaLabel ?? undefined);
    const itemRef = ref(ele => { heading.renderedEles.item = ele; });

    let content = heading.title;
    if ( contentType === 'button' ) {
      content = html`
        <button
          ${itemRef}
          type="button"
          class=${ifDefined(linkClasses)}
          aria-label=${ariaLabel}
          aria-expanded=${ifDefined(opts.ariaExpanded)}
          aria-controls=${ifDefined(opts.ariaControls)}
          ?disabled=${heading.disabled}
          @click=${heading.click}>${heading.title}</button>`;
    } else if ( contentType === 'a' ) {
      content = html`
        <a
          ${itemRef}
          href=${heading.href}
          target=${ifDefined(heading.target ?? undefined)}
          class=${ifDefined(linkClasses)}
          aria-label=${ariaLabel}
          @click=${heading.click}>${heading.title}</a>`;
    }

    return staticHtml`<${tag} ${ref(ele => { heading.renderedEles.heading = ele; })} class=${ifDefined(headingClasses)}>${content}</${tag}>`;
  }

  /**
   * @description Whether two parsed headings are the same: same light DOM elements, and same tag, heading class, text and link attributes.
   * @param {Heading|null} a - A heading, or null.
   * @param {Heading|null} b - A heading, or null.
   * @returns {Boolean} True if both are null, or neither differs in any compared property.
   */
  _isSameHeading(a, b){
    if ( !a || !b ) return a === b;
    return ['tag', 'headingClass', 'title', 'href', 'target', 'disabled', 'ariaLabel', 'ele', 'headingEle'].every(key => a[key] === b[key]);
  }

  /**
   * @description Collapses whitespace and trims.
   * @param {String} text - Text.
   * @returns {String}
   */
  _cleanText(text){
    return (text || '').replace(/\s+/g, ' ').trim();
  }
}

/**
 * @description Joins class strings and classMap objects into a class attribute value.
 * @param {Array} classList - Space-separated strings and/or classMap objects. Falsy entries are skipped.
 * @returns {String|undefined} Undefined if there are no classes, so ifDefined leaves the attribute off.
 */
function toClassAttribute(classList){
  return classList
    .map(c => c && typeof c === 'object' ? Object.entries(c).filter(([, on]) => on).map(([name]) => name).join(' ') : (c || ''))
    .join(' ').trim().replace(/\s+/g, ' ') || undefined;
}
