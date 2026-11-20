import { html, css } from 'lit';

import { HeadingController } from '@ucd-lib/cork-theme/utils/controllers';
import collapseCss from '@ucd-lib/cork-theme/styles/js/4_component/_collapse.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }

    /* Campus's h2 look for every title tag, including a div/span with data-heading */
    .collapse__title {
      position: relative;
      font-style: normal;
      font-weight: 800;
    }
    :where(.collapse__title) {
      line-height: 1.2;
    }

    /* The button is plain text in the title bar. Its ::before stretches over the whole bar, so all of it is clickable,
    including the padding and the icon, while the title keeps campus's padding and icon */
    .collapse__button {
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: inherit;
      cursor: pointer;
    }
    .collapse__button::before {
      content: '';
      position: absolute;
      inset: 0;
    }
    /* When open, the icon is rotated, and the transform paints it above the button's ::before, where it would catch clicks */
    .collapse__title::after {
      pointer-events: none;
    }
    .collapse__button:focus-visible {
      outline: none;
    }
    .collapse__button:focus-visible::before {
      outline: 2px solid currentColor;
      outline-offset: -4px;
    }

    /* slide-element animates the height, so padding must be inside it.
    The forced-contrast reset keeps slotted headings and links readable on the white box in force-contrast layout sections.
    The theme's global stylesheet also restores link colors, which can't be done from here */
    .collapse__content {
      box-sizing: border-box;
      --forced-contrast: initial;
      --forced-contrast-heading-primary: initial;
      --forced-contrast-heading-secondary: initial;
      --forced-scheme: initial;
      --forced-scheme-contrast: initial;
    }
  `;

  return [
    ...HeadingController.styles,
    collapseCss,
    elementStyles
  ];
}

export function render() {
  const titleClasses = {
    'collapse__title': true,
    'collapse__title--open': this.open,
    'collapse__title--closed': !this.open
  };
  return html`
    <div class="collapse">
      ${this.ctl.heading.render({
        classes: titleClasses,
        linkClasses: 'collapse__button',
        button: true,
        ariaExpanded: String(this.open),
        ariaControls: 'content'
      })}
      <div id="content" class="collapse__content">
        <slot></slot>
      </div>
    </div>
  `;
}
