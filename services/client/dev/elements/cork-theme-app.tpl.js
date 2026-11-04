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
      </ul>
    </cork-primary-nav>
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