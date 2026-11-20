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
    <cork-pages selected=${this.page} attr-for-selected='page-id' fallback-selection='home'>
      <cork-theme-page-home page-id="home"></cork-theme-page-home>
      <cork-theme-page-elements page-id="elements"></cork-theme-page-elements>
      <cork-theme-page-elements-single page-id="elements-single"></cork-theme-page-elements-single>
      <cork-theme-page-utils page-id="utils"></cork-theme-page-utils>
      <cork-theme-page-utils-single page-id="utils-single"></cork-theme-page-utils-single>
      <cork-theme-page-controllers-single page-id="controllers-single"></cork-theme-page-controllers-single>
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
            <li>
              Other Navigation
              <span data-nav='description'>Other navigation components, including tabs, submenus and pagers.</span>
              <ul>
                <li><a href='/elements/cork-nav-sub'>Submenu</a></li>
                <li><a href='/elements/cork-nav-sub-popover'>Submenu Popover</a></li>
                <li><a href='/elements/cork-nav-tabs'>Tabs</a></li>
                <li><a href='/elements/cork-pager'>Pager</a></li>
              </ul>
            </li>
            <li>
              Content Visibility
              <span data-nav='description'>Components for controlling content visibility, including pages and collapses.</span>
              <ul>
                <li><a href='/elements/cork-collapse'>Collapse</a></li>
                <li><a href='/elements/cork-pages'>Pages</a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a>Styles</a></li>
        <li>
          <a href="/utils">Utils</a>
          <span data-nav='description'>A collection of utility classes and mixins to use in your own components.</span>
          <ul>
            <li><a href="/utils/controllers">Controllers</a></li>
            <li><a href="/utils/mixins">Mixins</a></li>
            <li><a href="/utils/assets">Assets</a></li>
            <li><a href="/utils/layout">Layout</a></li>
          </ul>
        </li>
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