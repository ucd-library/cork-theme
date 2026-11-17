import '@ucd-lib/cork-theme/elements/cork-primary-nav';

// Shown on the header's blue, where it normally sits
export const background = 'var(--ucd-blue)';

// Starting markup for the cork-primary-nav demo
export default `
<cork-primary-nav>
  <ul>
    <li>
      <a href="#">Services</a>
      <ul>
        <li><a href="#">Borrowing</a></li>
        <li><button>Printing</button></li>
      </ul>
    </li>
    <li><a href="#">Collections</a></li>
    <li><a href="#">About</a></li>
  </ul>
</cork-primary-nav>
`;
