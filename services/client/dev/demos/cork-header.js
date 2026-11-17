import '@ucd-lib/cork-theme/elements/cork-header';
import '@ucd-lib/cork-theme/elements/cork-primary-nav';
import '@ucd-lib/cork-theme/elements/cork-search-form';
import '@ucd-lib/cork-theme/elements/cork-quick-links';
import '@ucd-lib/cork-theme/elements/cork-branding-bar';

// Starting markup for the cork-header demo
export default `
<cork-header backdrop="1" no-sticky>
  <cork-primary-nav>
    <ul>
      <li>
        <a href="#">Services</a>
        <ul>
          <li><a href="#">Borrowing</a></li>
          <li><a href="#">Printing</a></li>
        </ul>
      </li>
      <li><a href="#">Collections</a></li>
      <li><a href="#">About</a></li>
    </ul>
  </cork-primary-nav>
  <cork-search-form placeholder="Search the library"></cork-search-form>
  <cork-quick-links>
    <a href="#">Hours</a>
    <a href="#">Give</a>
    <a href="#">Contact</a>
  </cork-quick-links>
  <cork-branding-bar></cork-branding-bar>
</cork-header>
`;
