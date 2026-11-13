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
    <p>a list of elements</p>
  `;
}