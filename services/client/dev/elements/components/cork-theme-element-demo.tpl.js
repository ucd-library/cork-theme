import { html, css, unsafeCSS } from 'lit';
import { ApiDemoBase } from '@api-viewer/demo/lib/base.js';
import sharedStyles from '@api-viewer/common/lib/shared-styles.js';
import demoStyles from '@api-viewer/demo/lib/styles.js';
import { renderSnippet } from '@api-viewer/demo/lib/ui/snippet.js';
import themeStyles from '@ucd-lib/cork-theme/styles/css/style-ucdlib.css';

export function styles() {
  // api-demo's theming custom properties, set to brand values
  const themeProperties = css`
    :host {
      max-width: none;
      min-width: 0;
      margin-bottom: 2rem;
      font-family: var(--font-family);
      --ave-primary-color: var(--ucd-blue);
      --ave-header-background: var(--ucd-blue);
      --ave-header-color: var(--white);
      --ave-accent-color: var(--ucd-gold);
      --ave-secondary-color: var(--black-70);
      --ave-border-color: var(--black-20);
      --ave-border-radius: var(--border-radius);
      --ave-item-color: var(--black-90);
      --ave-label-color: var(--black-80);
      --ave-link-color: var(--ucd-blue-80);
      --ave-link-hover-color: var(--ucd-blue);
      --ave-tab-color: var(--black-70);
      --ave-tag-background-color: var(--black-10);
      --ave-tag-border-color: var(--black-20);
      --ave-tag-color: var(--black-80);
      --ave-button-background: var(--ucd-blue-80);
      --ave-button-active-background: var(--ucd-blue);
      --ave-button-color: var(--white);
      --ave-monospace-font: var(--font-family-monospace);
    }
    [part='demo-tabs'] [part='tab-panel'] {
      background: var(--white);
    }
    [part="knobs"] {
      padding: 1rem;
    }
    /* set from the background property */
    [part='demo-output'] {
      background: var(--cork-demo-output-background, var(--white));
    }
    /* the slots column is always hidden (each demo has a slot template), so the properties column gets the full width */
    [part='knobs-column']:not(:only-child) {
      flex-basis: 100%;
    }
  `;

  // highlight-ts token colors, matching the Prism colors in the package's ucdlib-sass/_code-highlight.scss
  const snippetStyles = css`
    pre {
      color: var(--black-90);
    }
    .comment {
      color: var(--black-70);
      font-style: italic;
    }
    .tag {
      color: var(--black-80);
    }
    .name,
    .selector-tag {
      color: var(--ucd-blue);
    }
    .attr,
    .attribute {
      color: var(--delta);
    }
    .string {
      color: var(--redwood);
    }
    .number {
      color: var(--double-decker);
    }
    .meta {
      color: var(--pinot);
    }
    .built_in {
      color: var(--wonder-blue);
    }
    .css {
      color: var(--black-90);
    }
    :not(pre) code {
      background-color: var(--black-10);
    }
  `;

  const markupPanelStyles = css`
    .markup {
      border-top: 1px solid var(--ave-border-color);
    }
    .markup__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      padding: .5rem 1rem;
      border-bottom: 1px solid var(--ave-border-color);
    }
    .markup__label {
      font-weight: var(--font-weight-bold);
      color: var(--ave-label-color);
    }
    .markup__buttons {
      display: flex;
      gap: .5rem;
    }
    [part='markup-snippet'] {
      background: var(--black-10);
      padding: .75rem 1rem;
      overflow: auto;
    }
    .markup textarea {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-height: 12rem;
      margin: 0;
      border: none;
      padding: .75rem 1rem;
      font-family: var(--ave-monospace-font);
      font-size: .875rem;
      line-height: 1.5;
      resize: vertical;
    }
    .markup .alert {
      margin: 0;
    }
  `;

  return [sharedStyles, demoStyles, unsafeCSS(themeStyles), themeProperties, snippetStyles, markupPanelStyles];
}

export function render() {
  return html`
    ${ApiDemoBase.prototype.render.call(this)}
    ${this.selected ? renderMarkupPanel.call(this) : ''}
  `;
}

/**
 * @description Renders the markup panel: the element's snippet, or a textarea for editing it as HTML.
 * @returns {TemplateResult}
 */
function renderMarkupPanel() {
  const knobs = this.getLayout()?.knobs || {};
  return html`
    <section class="markup" part="markup">
      <div class="markup__toolbar">
        <span class="markup__label">${this._editing ? 'Edit as HTML' : 'HTML'}</span>
        <div class="markup__buttons">
          ${this._editing ? html`
            <button class="btn btn--primary btn--sm" @click=${this._onApplyClick}>Apply</button>
            <button class="btn btn--sm" @click=${this._onCancelClick}>Cancel</button>
          ` : html`
            <button class="btn btn--primary btn--sm" @click=${this._onEditClick}>Edit as HTML</button>
            <button class="btn btn--sm" @click=${this._onCopyClick}>Copy</button>
          `}
        </div>
      </div>
      <div class="alert alert--error" ?hidden=${!this._error}>${this._error}</div>
      ${this._editing ? html`
        <textarea
          aria-label="Markup for ${this.selected}"
          spellcheck="false"
          .value=${this._draft}
          @input=${e => this._draft = e.target.value}></textarea>
      ` : html`
        <div part="markup-snippet">${renderSnippet(this._id, this.selected, knobs, [], [])}</div>
      `}
    </section>
  `;
}
