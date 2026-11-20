import { html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import formsCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_forms.css.js';
import tabsCss from '@ucd-lib/cork-theme/styles/js/4_component/_tabs.css.js';
import tabsButtonsCss from '@ucd-lib/cork-theme/styles/js/ucdlib-sass/_tabs-buttons.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [
    formsCss,
    tabsCss,
    tabsButtonsCss,
    elementStyles
  ];
}

export function render() {
  const listClasses = {
    'tabs': true,
    'tabs--secondary': this.secondary
  };
  return html`
    <nav aria-label=${this.navAriaLabel || 'Tabs'}>
      <ul class=${classMap(listClasses)}>
        ${this.ctl.nav.navItems.map(navItem => html`
          <li>${navItem.render({ classes: 'tabs__item', activeClass: 'tabs__item--active' })}</li>`
        )}
      </ul>
    </nav>
  `;
}
