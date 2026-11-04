import { html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import miscCss from '@ucd-lib/cork-theme/styles/js/2_base_class/_misc.css.js';
import navQuickLinksCss from '@ucd-lib/cork-theme/styles/js/4_component/_nav-quicklinks.css.js';
import navQuickLinksButtonsCss from '@ucd-lib/cork-theme/styles/js/ucdlib-sass/_nav-quicklinks-buttons.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [
    miscCss,
    navQuickLinksCss,
    navQuickLinksButtonsCss,
    elementStyles
  ];
}

export function render() { 
  const baseClass = 'nav-quicklinks';
  const navClasses = {
    [baseClass]: true
  };
  for (const [key, value] of Object.entries(this._modifiers)) {
    navClasses[`${baseClass}--${key}`] = value;
  }
  return html`
    <nav class=${classMap(navClasses)} aria-label="${this.headerComponentLabel} menu">
      <ul class="menu" data-menu-name="menu-quick-links">
        ${this.ctl.nav.navItems.map(navItem => html`
          <li>${navItem.render()}</li>`
        )}
      </ul>
    </nav>
  `;}