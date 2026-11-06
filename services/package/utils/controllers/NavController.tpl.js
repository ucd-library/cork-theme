import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

import navDrillCss from '@ucd-lib/cork-theme/styles/js/4_component/_nav-drill.css.js';
import navPrimaryCss from '@ucd-lib/cork-theme/styles/js/4_component/_nav-primary.css.js';

/**
 * @description Styles for a drill-down navigation.
 * @returns {Array} Lit css results.
 */
export function drillDownStyles() {
  return [
    navDrillCss,
    navPrimaryCss,
    css`
      button {
        cursor: pointer;
        text-transform: none;
        margin: 0;
        font-family: inherit;
        -webkit-appearance: button;
      }
      *, ::before, ::after {
        box-sizing: border-box;
      }
      .nav-primary .nav-drill__description-title button {
        font-weight: 700;
        min-height: 0;
        padding: 0;
      }
      .nav-drill__list .nav-drill__submenu .nav-drill__submenu-toggle::after {
        margin-top: .4em; /* chevron doesn't align properly. dont know why. */
      }

    `
  ]
}

/**
 * @description Renders an item's own element for the host's shadow DOM: a button, anchor, or span.
 * Automatically wires up button clicks and relevant attributes, and records the element as item.renderedEles.item. Does not render sub items.
 * Called by item.render.
 * @param {NavItem} item - The item.
 * @param {Object|String} opts - Options. A string is treated as opts.classes.
 * @param {String|Object} opts.classes - Classes to apply: a space-separated string, or a classMap object.
 * @param {Object} opts.typeClasses - Classes to apply by rendered element type, added to opts.classes.
 * Keys: button, a, span. Each value is a string or classMap object, e.g. { button: 'nav-drill__button', span: 'nav-drill__nolink' }
 * @param {TemplateResult} opts.suffixTemplate - An optional template to add directly after the item text
 * @returns {TemplateResult}
 */
export function renderItem(item, opts={}){
  if ( typeof opts === 'string' ) opts = { classes: opts };
  const eleType = item.ele?.matches('button') ? 'button' : item.href ? 'a' : 'span';

  // ifDefined can't be combined with Lit's native classMap, so convert objects to strings here
  const classes = [opts.classes, opts.typeClasses?.[eleType]]
    .map(c => c && typeof c === 'object' ? Object.entries(c).filter(([, on]) => on).map(([name]) => name).join(' ') : (c || ''))
    .join(' ');

  const ariaLabel = ifDefined(item.ariaLabel ?? undefined);
  const classAtr = ifDefined(classes.trim().replace(/\s+/g, ' ') || undefined);
  const eleRef = ref(ele => { item.renderedEles.item = ele; });

  if ( eleType === 'button' ) {
    return html`
      <button
        ${eleRef}
        type="button"
        class=${classAtr}
        aria-label=${ariaLabel}
        ?disabled=${item.disabled}
        @click=${item.click}>${item.title}${opts.suffixTemplate ? opts.suffixTemplate : html``}</button>`;
  }
  if ( eleType === 'a' ) {
    return html`
      <a
        ${eleRef}
        href=${item.href}
        target=${ifDefined(item.target ?? undefined)}
        class=${classAtr}
        aria-label=${ariaLabel}>${item.title}${opts.suffixTemplate ? opts.suffixTemplate : html``}</a>`;
  }
  return html`<span ${eleRef} class=${classAtr}>${item.title}${opts.suffixTemplate ? opts.suffixTemplate : html``}</span>`;
}

/**
 * @description Render a styled drill-down menu.
 * @returns {TemplateResult}
 */
export function renderDrillDown(){
  return html`
    <div class="nav-drill__inner" ${ref(ele => { this._drillDownInnerEle = ele; })}>
      <ul class="nav-drill__list">
        ${this.navItems.map(item => html`
          <li>${renderDrillDownTopItem.call(this, item)}</li>
        `)}
      </ul>
      
    </div>
  `;
}

/**
 * @description Render a styled drill-down submenu.
 * @param {NavItem} item - The nav item whose subItems are rendered.
 * @returns {TemplateResult}
 */
function renderDrillDownSubMenu(item){
  if ( !item.subItems.length ) return html``;
  const menuClasses = {
    'nav-drill__submenu': true,
    [`nav-drill__submenu--level-${item.navPosition.length + 1}`]: true,
    'nav-drill__submenu--expanded': item.containsCoordinates(this.host[this.hostFocusedCoordinatesProperty])
  }

  return html`
    <div class=${classMap(menuClasses)} id="nav-drill-submenu-${item.navPosition.join('-')}" ${ref(ele => { item.renderedEles.submenu = ele; })}>
      <div class="nav-drill__submenu-wrapper">
        <div class="nav-drill__description">
          <button class="nav-drill__submenu-close" aria-label="Close ${item.title} menu" @click=${() => this._onDrillDownToggleClick(item, true)}></button>
          <div class="nav-drill__description-content">
            <div class="nav-drill__description-title">${item.render({typeClasses: { button: 'nav-drill__button' }})}</div>
            <p ?hidden=${!item.fields?.description}>${item.fields?.description}</p>
          </div>
        </div>
        <ul class="nav-drill__list">
          ${item.subItems.map(subItem => subItem.subItems.length ? 
            html`
              <li>
                <div>
                  <button 
                    class="nav-drill__submenu-toggle" 
                    ${ref(ele => { subItem.renderedEles.linkToSubmenu = ele; })} 
                    aria-controls="nav-drill-submenu-${subItem.navPosition.join('-')}" 
                    aria-expanded=${subItem.containsCoordinates(this.host[this.hostFocusedCoordinatesProperty])} 
                    @click=${() => this._onDrillDownToggleClick(subItem)}>
                    ${subItem.title}
                  </button>
                </div>
                ${renderDrillDownSubMenu.call(this, subItem)}
              </li>
            ` : 
            html`
              <li>${subItem.render({typeClasses: { button: 'nav-drill__button', span: 'nav-drill__nolink' }})}</li>
            `)}
        </ul>

      </div>
    </div>
  `;
}

/**
 * @description Render a top-level drill-down item.
 * @param {NavItem} item - The nav item to render.
 * @returns {TemplateResult}
 */
function renderDrillDownTopItem(item){
  if ( item.navPosition.length > 1 ) return html``;
  const wrapperClass = 'nav-drill__top-link';
  const line = html`<span class="nav-drill__top-link-line"></span>`;

  if ( item.subItems.length ){
    return html`
      <div class=${wrapperClass}>
        <button 
          class="nav-drill__submenu-toggle" 
          ${ref(ele => { item.renderedEles.linkToSubmenu = ele; })} 
          aria-controls="nav-drill-submenu-${item.navPosition.join('-')}" 
          aria-expanded=${item.containsCoordinates(this.host[this.hostFocusedCoordinatesProperty])} 
          @click=${() => this._onDrillDownToggleClick(item)}>
          ${item.title}
          ${line}
        </button>
      </div>
      ${renderDrillDownSubMenu.call(this, item)}
    `;
  }
  return html`
    <div class=${wrapperClass}>
      ${item.render({
        suffixTemplate: line,
        typeClasses: { button: 'nav-drill__button', span: 'nav-drill__nolink' }
      })}
    </div>
  `;
}
