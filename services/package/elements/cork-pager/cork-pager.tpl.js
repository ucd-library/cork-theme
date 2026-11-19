import { html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import normalizeCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_normalize.css.js';
import pagerCss from '@ucd-lib/cork-theme/styles/js/4_component/_pager.css.js';
import pagerButtonsCss from '@ucd-lib/cork-theme/styles/js/ucdlib-sass/_pager-buttons.css.js';
import pagerIconsCss from '@ucd-lib/cork-theme/styles/js/ucdlib-sass/_pager-icons.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
    [hidden] {
      display: none !important;
    }

    /* the "Page X of Y" text only shows in the mini view */
    .pager__item--mini-label {
      display: none;
    }

    /* the mini view has only prev, next and the text */
    .pager--mini .pager__item.pager__item--page,
    .pager--mini .pager__item.pager__item--ellipses {
      display: none;
    }

    /* Narrow pagers switch to the mini view, unless no-mini is set. Repeats campus's .pager--mini rules (4_component/_pager.scss), which need the class */
    @container (width < 768px) {
      .pager:not(.pager--no-mini) .pager__item.pager__item--page,
      .pager:not(.pager--no-mini) .pager__item.pager__item--ellipses {
        display: none;
      }
      .pager:not(.pager--no-mini) .pager__item--current {
        display: block;
        padding: 0.25rem 0.5rem;
        background: transparent;
        color: var(--forced-contrast, var(--black-70));
        cursor: default;
      }
      .pager:not(.pager--no-mini) .pager__item--current:hover {
        background: transparent;
      }
    }
  `;

  return [
    normalizeCss,
    pagerCss,
    pagerButtonsCss,
    pagerIconsCss,
    elementStyles
  ];
}

export function render() {

  const pagerClasses = {
    'pager': true,
    'pager--mini': this.onlyMini,
    'pager--no-mini': this.noMini
  };
  return html`
    <nav aria-label=${this.navAriaLabel || 'Pagination'}>
      <ul class=${classMap(pagerClasses)}>
        ${this.pagerItems.map(item => html`
          ${item.type === 'next' ? renderMiniLabel.call(this) : ''}
          ${renderItem.call(this, item)}
        `)}
      </ul>
    </nav>
  `;
}

/**
 * @description Renders the mini view's "Page X of Y" text, or "Page X" with noMaxOnMini. Hidden by CSS outside the mini view.
 * @returns {TemplateResult}
 */
function renderMiniLabel(){
  const currentPage = Math.min(this.currentPage, this.maxPage);
  return html`
    <li class="pager__item pager__item--current pager__item--static pager__item--mini-label">
      Page ${currentPage}${this.noMaxOnMini ? '' : ` of ${this.maxPage}`}
    </li>
  `;
}

/**
 * @description Renders a pager item: a link if it has one, a button if it doesn't, or static text for an unlinked current page and for ellipses with staticEllipses.
 * Other ellipses link to (or are buttons for) the hidden page next to the shown ones, labelled with that page.
 * Prev and next are disabled buttons when there's no page to go to.
 * @param {PagerItem} item - The item to render.
 * @returns {TemplateResult}
 */
function renderItem(item){
  const isEnd = (item.type === 'prev' || item.type === 'next') && item.page === Math.min(this.currentPage, this.maxPage);
  const itemClasses = {
    'pager__item': true,
    'pager__item--current': item.current,
    'pager__item--previous': item.type === 'prev',
    'pager__item--next': item.type === 'next',
    'pager__item--page': item.type === 'page',
    'pager__item--ellipses': item.type === 'ellipses'
  };

  // static ellipses, with staticEllipses set, are just a visual gap
  if ( item.type === 'ellipses' && item.page === null ) {
    return html`<li class="${classMap({ ...itemClasses, 'pager__item--static': true })}" aria-hidden="true">…</li>`;
  }

  let text = item.page;
  let ariaLabel = `Page ${item.page}`;
  if ( item.type === 'ellipses' ) {
    text = '…';
  } else if ( item.type === 'prev' ) {
    text = 'Prev';
    ariaLabel = 'Previous page';
  } else if ( item.type === 'next' ) {
    text = 'Next';
    ariaLabel = 'Next page';
  }
  const ariaCurrent = item.current ? 'page' : undefined;

  // the current page isn't clickable without a link, so it's static text
  if ( item.current && !item.link ) {
    return html`
      <li class="${classMap({ ...itemClasses, 'pager__item--static': true })}" aria-current="page">${text}</li>
    `;
  }

  if ( item.link && !isEnd ) {
    return html`
      <li class=${classMap(itemClasses)}>
        <a href=${item.link} aria-label=${ariaLabel} aria-current=${ifDefined(ariaCurrent)} @click=${e => this._onItemClick(item, e)}>${text}</a>
      </li>
    `;
  }

  return html`
    <li class=${classMap(itemClasses)}>
      <button type="button" ?disabled=${isEnd} aria-label=${ariaLabel} @click=${e => this._onItemClick(item, e)}>${text}</button>
    </li>
  `;
}
