import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    cork-theme-page-element {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <section>
      <h1 class="page-title">Elements</h1>
    </section>
    <ol class="breadcrumbs ">
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/elements">Elements</a>
      </li>
    </ol>
    <div class="breadcrumbs__dots"></div>
    <div class="l-container">
      <div class="l-content">
        ${this.ctl.markdown.renderSection('elements', { stripTopHeading: true })}
      </div>
    </div>
  `;
}