import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    cork-theme-page-element-single {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <section>
      <h1 class="page-title">${this.elementTag}</h1>
    </section>
    <ol class="breadcrumbs ">
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/elements">Elements</a>
      </li>
      <li>
        ${this.elementTag}
      </li>
    </ol>
    <div class="breadcrumbs__dots"></div>
    <div class="l-container">
      <div class="l-content">
        <p>element single</p>
      </div>
    </div>
  `;
}