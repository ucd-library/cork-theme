import { html, css } from 'lit';

import formsCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_forms.css.js';
import navLiteCss from '@ucd-lib/cork-theme/styles/js/4_component/_nav-lite.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [
    formsCss,
    navLiteCss,
    elementStyles
  ];
}

export function render() { 
  return html`
    <nav class='nav-lite' aria-label="${this.headerComponentLabel}">
      <ul class="nav-lite__list">
        ${this.ctl.nav.navItems.map(navItem => html`
          <li class="nav-lite__item">${navItem.render({typeClasses: {button: 'nav-lite__button', span: 'nav-lite__nolink'}})}</li>`
        )}
      </ul>
    </nav>
  `;
}