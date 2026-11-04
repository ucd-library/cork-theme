import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

import navPrimaryCss from '@ucd-lib/cork-theme/styles/js/4_component/_nav-primary.css.js';
import navDrillCss from '@ucd-lib/cork-theme/styles/js/4_component/_nav-drill.css.js';

export function drillDownStyles() {
  return [
    navPrimaryCss,
    navDrillCss,
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
    `
  ]
}

/**
 * @description Renders an item's own element for the host's shadow DOM: a button, anchor, or span.
 * Automatically wires up button clicks and relevant attributes. Does not render sub items.
 * Called by item.render.
 * @param {NavItem} item - The item.
 * @param {Object|String} opts - Options. A string is treated as opts.classes.
 * @param {String|Object} opts.classes - Classes to apply: a space-separated string, or a classMap object.
 * @param {TemplateResult} opts.suffixTemplate - An optional template to add directly after the item text
 * @returns {TemplateResult}
 */
export function renderItem(item, opts={}){
  if ( typeof opts === 'string' ) opts = { classes: opts };
  let classes = opts.classes || '';
  if ( typeof classes === 'object' ) {
    // ifDefined can't be combined with Lit's native classMap, so convert to a string
    classes = Object.entries(classes).filter(([, on]) => on).map(([name]) => name).join(' ');
  }

  const ariaLabel = ifDefined(item.ariaLabel ?? undefined);
  const classAtr = ifDefined(classes.trim().replace(/\s+/g, ' ') || undefined);

  if ( item.ele?.matches('button') ) {
    return html`
      <button
        type="button"
        class=${classAtr}
        aria-label=${ariaLabel}
        ?disabled=${item.disabled}
        @click=${item.click}>${item.title}${opts.suffixTemplate ? opts.suffixTemplate : html``}</button>`;
  }
  if ( item.href ) {
    return html`
      <a
        href=${item.href}
        target=${ifDefined(item.target ?? undefined)}
        class=${classAtr}
        aria-label=${ariaLabel}>${item.title}${opts.suffixTemplate ? opts.suffixTemplate : html``}</a>`;
  }
  return html`<span class=${classAtr}>${item.title}</span>`;
}

export function renderDrillDown(){
  return html`
    <div class="nav-drill__inner">
      <ul class="nav-drill__list">
        ${this.navItems.map(item => renderDrillDownItem.call(this, item))}
      </ul>
      
    </div>
  `;
}

function renderDrillDownItem(item, opts={}){
  return html`
    <li>
      ${renderDrillDownTopItem.call(this, item)}

    </li>
    `
}

function renderDrillDownTopItem(item){
  if ( item.navPosition.length > 1 ) return html``;
  const wrapperClass = 'nav-drill__top-link';
  const line = html`<span class="nav-drill__top-link-line"></span>`;

  if ( item.subItems.length ){
    return html`
      <div class=${wrapperClass}>
        <button class="nav-drill__submenu-toggle" aria-controls="nav-drill-submenu-${item.navPosition.join('-')}" aria=expanded=${item.containsCoordinates(this.host[this.hostFocusedCoordsProperty])} @click=${() => this._onDrillDownToggleClick(item)}>
          ${item.title}
          ${line}
        </button>
      </div>
    `;
  }
  if ( item.ele?.matches('button') ){
    return html`
      <div class=${wrapperClass}>
        ${line}
        ${item.render({ classes: 'nav-drill__button', suffixTemplate: line })}
      </div>
    `;
  }
  if ( item.href ){
    return html`
      <div class=${wrapperClass}>
        ${line}
        ${item.render({ suffixTemplate: line })}
      </div>
    `;
  }
  return html``;
}
