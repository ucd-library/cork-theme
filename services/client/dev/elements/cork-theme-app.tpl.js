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
    <cork-quick-links highlight two-columns>
      <button @click=${() => alert('Hello!')}>I'm a button</button>
      <a href='/foo'>Foo</a>
      <a href='#'>Bar</a>
      <a href='#'>Baz</a>
      <a href='#'>Qux</a>
      <button @click=${() => alert('Hello!')}>I'm a button</button>
    </cork-quick-links>
  </cork-header>

`;}