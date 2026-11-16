import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    cork-theme-page-utils {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <section>
      <h1 class="page-title">Utils</h1>
    </section>
    <ol class="breadcrumbs ">
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/utils">Utils</a>
      </li>
    </ol>
    <div class="breadcrumbs__dots"></div>
    <div class="l-container">
      <div class="l-content">
        ${this.ctl.markdown.renderSection('utils', { stripTopHeading: true })}
      </div>
    </div>
  `;
}