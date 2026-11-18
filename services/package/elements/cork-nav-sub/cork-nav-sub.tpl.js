import { html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import { NavController, HeadingController } from '@ucd-lib/cork-theme/utils/controllers';

import navSubStyles from '@ucd-lib/cork-theme/styles/js/4_component/_nav-sub.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
    /* campus only styles a linked title's a */
    .nav-sub__title-linked button {
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
  `;

  return [
    ...HeadingController.styles,
    ...NavController.drillDownStyles,
    navSubStyles,
    elementStyles
  ];
}

export function render() { 
  const navClasses = {
    'nav-sub': true,
    'nav-drill': true,
    'nav-drill--auto-height': this.autoHeight
  };

  const ariaLabel = this.navAriaLabel || this.ctl.heading.heading?.title || 'Submenu';
  return html`
    <nav class=${classMap(navClasses)} aria-label="${ariaLabel}">
      ${this.ctl.heading.render({ typeClasses: { a: 'nav-sub__title-linked', button: 'nav-sub__title-linked', text: 'nav-sub__title' } })}
      ${this.ctl.nav.renderDrillDown()}
    </nav>
  `;
}