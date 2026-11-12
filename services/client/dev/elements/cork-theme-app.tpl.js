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
    <cork-primary-nav>
      <ul>
        <li><a href='/'>Home</a></li>
        <li>
          <a href='/services'>Services</a>
          <span data-nav='description'>Borrowing, printing, and research help</span>
          <ul>
            <li>
              <a href='/services/borrow'>Borrowing</a>
              <ul>
                <li>
                  <a href='/services/borrow/books'>Books</a>
                  <ul>
                    <li><a href='/services/borrow/books/renew'>Renewals</a></li>
                    <li><a href='/services/borrow/books/holds'>Holds</a></li>
                    <li><button @click=${() => alert('Renew all')}>Renew all</button></li>
                  </ul>
                </li>
                <li><a href='/services/borrow/equipment'>Equipment</a></li>
                <li><button disabled @click=${() => alert('Should not fire')}>Disabled button</button></li>
              </ul>
            </li>
            <li>
              Printing
              <ul>
                <li><a href='/services/print/color'>Color printing</a></li>
                <li>
                  3D printing
                  <ul>
                    <li><a href='/services/print/3d/request'>Request a print</a></li>
                    <li>Coming soon</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><button @click=${() => alert('Opening chat')}>Chat with a librarian</button></li>
          </ul>
        </li>
        <li>
          Collections
          <span data-nav='description'>An inert heading with a description</span>
          <ul>
            <li>
              <a href='/collections/special'>Special Collections</a>
              <ul>
                <li>
                  <button @click=${() => alert('Browse archives')}>Archives</button>
                  <ul>
                    <li><a href='/collections/special/archives/finding-aids'>Finding aids</a></li>
                    <li><a href='https://oac.cdlib.org' target='_blank'>Online Archive of California</a></li>
                  </ul>
                </li>
                <li><a>Link with no href</a></li>
              </ul>
            </li>
            <li><a href='/collections/digital' aria-label='Digital collections, opens the digital library'>Digital</a></li>
          </ul>
        </li>
        <li><button @click=${() => alert('Hello!')}>Top-level button</button></li>
        <li>Inert top-level item</li>
        <li>
          <button @click=${() => alert('Hello!')}>Button with subnav</button>
          <ul>
            <li><a href='/foo'>Foo</a></li>
            <li><button @click=${() => alert('Hello!')}>Bar</button></li>
            <li><a>Baz</a></li>
          </ul>
        </li>
      </ul>
    </cork-primary-nav>
    
    <cork-search-tray>
      <cork-search-form
        placeholder="Search the site"
        @cork-search=${(e) => alert(`Searching for: ${JSON.stringify(e.detail)}`)}
        form-method="get">
        <button name="directory">Directory</button>
        <button name="news" aria-label="Search the news">News</button>
      </cork-search-form>
      <cork-search-common heading="Common Searches">
        <a href="#">What is the deal with that?</a>
        <a href="#">How do I get started?</a>
        <a href="#">Where can I find more information?</a>
        <button @click=${() => alert('Hello!')}>I'm a button</button>
      </cork-search-common>
    </cork-search-tray>
    
    <cork-quick-links highlight two-columns>
      <button @click=${() => alert('Hello!')}>I'm a button</button>
      <a href='/foo'>Foo</a>
      <a href='#'>Bar</a>
      <a href='#'>Baz</a>
      <a href='#'>Qux</a>
      <button @click=${() => alert('Hello!')}>I'm a button</button>
    </cork-quick-links>

    <cork-branding-bar>
    </cork-branding-bar>

    <cork-nav-lite copy-from-primary-nav primary-nav-max-items="3"></cork-nav-lite>
  </cork-header>

  <cork-pages selected='foo'>
    <div id="foo">Foo</div>
    <div id="bar">Bar</div>
    <div id="baz">Baz</div>
  </cork-pages>

`;}