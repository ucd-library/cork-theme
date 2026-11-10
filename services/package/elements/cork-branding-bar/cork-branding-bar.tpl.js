import { html, css } from 'lit';

import headingsCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_headings.css.js';
import headerCss from '@ucd-lib/cork-theme/styles/js/4_component/_header.css.js';
import siteBrandingCss from '@ucd-lib/cork-theme/styles/js/4_component/_site-branding.css.js';

/**
 * @description Styles for the cork-branding-bar element.
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
    .book-logo {
      max-height: 6.25rem;
      max-width: 100%;
      height: auto;
      width: 70px;
      min-width: 70px;
    }
  `;

  return [
    headingsCss,
    headerCss,
    siteBrandingCss,
    elementStyles
  ];
}

/**
 * @description Main render function for the cork-branding-bar element.
 * @returns {TemplateResult}
 */
export function render() {
  return html`
    <div class="header__branding">
      <div class="site-branding">
        <div class="site-branding__figure" ?hidden=${this.noSiteLogo}>
          <a href=${this.siteUrl} aria-hidden="true" tabindex="-1">
            <slot name="site-logo">
              ${bookLogo.call(this)}
            </slot>
          </a>
        </div>
        <div class="site-branding__body">
          <h1 class="site-branding__site-name">
            <a href=${this.siteUrl}>${this.siteName}</a>
          </h1>
          <div class="site-branding__slogan" ?hidden=${!this.slogan}>
            ${this.slogan}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @description Renders the library's book logo, the default for the site-logo slot.
 * @returns {TemplateResult}
 */
function bookLogo() {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 276.31 432.01" class='book-logo'>
      <path d="M102.37,337.79,148,325.38c13.66-3.71,24-17.44,24-31.94V121.15l-69.56-11Z" style="fill:#ffbf00"/>
      <path d="M171.94,87.9V0L24.87,31.15C10.69,34.15,0,47.81,0,63v302.7l69.55-18.93v-275Z" style="fill:#ffbf00"/>
      <path d="M250.56,100.25,171.94,87.9v33.26l71.49,11.24V393.6l-141-22.18V337.8l-32.84,8.94v25.48c0,15.3,11.3,29.06,25.72,31.33l181,28.46V131.58C276.27,116.28,265,102.52,250.56,100.25Z" style="fill:#022851"/>
    </svg>
  `;
}