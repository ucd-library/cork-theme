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
  <cork-header>
    <div slot='primary-nav'>Primary Navigation</div>
    <div slot='search'>Search</div>
    <div slot='quick-links'>Quick Links</div>
  </cork-header>

`;}