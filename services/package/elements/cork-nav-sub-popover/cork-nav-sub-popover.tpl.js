import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';

import { styles as navSubStyles, renderNav } from '@ucd-lib/cork-theme/elements/cork-nav-sub/cork-nav-sub.tpl.js';

import navSubPopoverStyles from '@ucd-lib/cork-theme/styles/js/4_component/_nav-sub-popover.css.js';

export function styles() {
  return [
    ...navSubStyles(),
    navSubPopoverStyles
  ];
}

export function render() {
  return html`
    <div class="nav-sub-popover">
      <button class="nav-sub-popover__btn" ${ref(this.ctl.popover.buttonRef)}>${this._buttonLabel}</button>
      <div class="nav-sub-popover__tray" ${ref(this.ctl.popover.popoverRef)}>
        ${renderNav.call(this, { hideHeading: this.hideHeading })}
      </div>
    </div>
  `;
}
