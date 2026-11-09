import { html, css } from 'lit';

import headingsCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_headings.css.js';
import searchTrayCss from '@ucd-lib/cork-theme/styles/js/4_component/_search-tray.css.js';
import searchTrayButtonsCss from '@ucd-lib/cork-theme/styles/js/ucdlib-sass/_search-tray-buttons.css.js';

/**
 * @description Styles for the cork-search-common element.
 * @returns {Array} Lit css results.
 */
export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
    [hidden] {
      display: none !important;
    }
  `;

  return [
    headingsCss,
    searchTrayCss,
    searchTrayButtonsCss,
    elementStyles
  ];
}

/**
 * @description Main render function for the cork-search-common element.
 * @returns {TemplateResult}
 */
export function render() {
  return html`
    <div class="search-tray__common">
      <h2 class="search-tray__common-title" ?hidden=${!this.heading}>${this.heading}</h2>
      <ul>
        ${this.ctl.nav.navItems.map(navItem => html`
          <li>${navItem.render()}</li>
        `)}
      </ul>
    </div>
  `;
}
