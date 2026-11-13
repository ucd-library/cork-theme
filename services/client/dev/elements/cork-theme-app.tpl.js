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
  ${renderHeader.call(this)}

  <main class="l-main">
    <cork-pages selected=${this.page} attr-for-selected='page-id'>
      <cork-theme-page-elements page-id="elements"></cork-theme-page-elements>
      <cork-theme-page-elements-single page-id="elements-single"></cork-theme-page-elements-single>
    </cork-pages>
  </main>

`;}

function renderHeader(){
  return html`
  <cork-header>
    <cork-primary-nav>
      <ul>
        <li><a>Quick Start</a></li>
        <li>
          <a href="/elements">Elements</a>
          <span data-nav='description'>A collection of branded web components to drop into any site.</span>
          <ul>
            <li>
              <a href='/elements/cork-header'>Header</a>
              <span data-nav='description'>A site header and all its component parts.</span>
              <ul>
                <li><a href='/elements/cork-primary-nav'>Primary Nav</a></li>
                <li><a href='/elements/cork-nav-lite'>Lite Nav</a></li>
                <li><a href='/elements/cork-search-tray'>Search Tray</a></li>
                <li><a href='/elements/cork-search-form'>Search Form</a></li>
                <li><a href='/elements/cork-quick-links'>Quick Links</a></li>
                <li><a href='/elements/cork-branding-bar'>Branding Bar</a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a>Styles</a></li>
        <li><a>Utilities</a></li>
      </ul>
    </cork-primary-nav>
    <cork-quick-links highlight two-columns header-component-label="Extensions">
      <a href="#">Cork App Utils</a>
      <a href="#">Cork Icon</a>
      <a href="#">Cork Build</a>
      <a href="#">SPA Middleware</a>
      <a href="#">Other Stuff</a>
    </cork-quick-links>
    <cork-branding-bar slogan="Cork Theme"></cork-branding-bar>
  </cork-header>`;
}