import { html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import searchTrayCss from '@ucd-lib/cork-theme/styles/js/4_component/_search-tray.css.js';

/**
 * @description Styles for the cork-search-tray element.
 * @returns {Array} Lit css results.
 */
export function styles() {
  const elementStyles = css`
    :host {
      display: block;
      height: 100%;
    }
    [hidden] {
      display: none !important;
    }
    /* Campus's .search-tray:has(.search-tray__common) rule, for common searches rendered in a child's shadow DOM */
    .search-tray__inner--has-common {
      margin-top: 0;
    }
  `;

  return [
    searchTrayCss,
    elementStyles
  ];
}

/**
 * @description Main render function for the cork-search-tray element.
 * The common searches render their own .search-tray__common box, in their shadow DOM. Campus's :has(.search-tray__common) check
 * can't see it there, so the inner wrapper's margin offset is dropped with a class instead.
 * @returns {TemplateResult}
 */
export function render() {
  const innerClasses = {
    'search-tray__inner': true,
    'search-tray__inner--has-common': !!this._slottedComponents.common.ele
  };
  return html`
    <div class="search-tray">
      <div class=${classMap(innerClasses)}>
        <slot name="form"></slot>
        <slot name="common"></slot>
      </div>
    </div>
  `;
}
