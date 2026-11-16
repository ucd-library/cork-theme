import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <section>
      <h1 class="page-title">${this.ctl.markdown.getTitle()}</h1>
    </section>
    <ol class="breadcrumbs ">
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/utils">Utils</a>
      </li>
      <li>${this.ctl.markdown.getTitle()}</li>
    </ol>
    <div class="breadcrumbs__dots"></div>
    <div class="l-container">
      <div class="l-content">
        ${this.ctl.markdown.render({ stripTopHeading: true })}
      </div>
    </div>
  `;
}