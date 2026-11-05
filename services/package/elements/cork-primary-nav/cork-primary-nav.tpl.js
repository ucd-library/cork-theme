import { html, css } from 'lit';

import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [
    ...NavController.drillDownStyles,
    elementStyles
  ];
}

export function render() { 

  return html`
    <nav class='nav-primary nav-drill nav-drill--dark nav-drill--contain-scroll' aria-label="${this.headerComponentLabel}">
      ${this.ctl.nav.renderDrillDown()}
    </nav>

  `;
}