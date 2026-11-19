import '@ucd-lib/cork-theme/elements/cork-nav-sub-popover';

// always on in this element
export const hiddenKnobs = ['autoHeight'];

// Starting markup for the cork-nav-sub-popover demo
export default `
<cork-nav-sub-popover>
  <h2><a href="#">Library Services</a></h2>
  <ul>
    <li>
      <a href="#">Services</a>
      <ul>
        <li><a href="#">Borrowing</a></li>
        <li><button>Printing</button></li>
        <li>
          Digital Services
          <ul>
            <li><a href="#">Remote Access</a></li>
            <li><a href="#">PDF Remediation</a></li>
            <li><a href="#">Data Analysis and Management</a></li>
            <li><a href="#">GIS and Mapping</a></li>
            <li>
              <a href="#">Digital Scholarship</a>
              <ul>
                <li><a href="#">Digital Humanities</a></li>
                <li><a href="#">Digital Publishing</a></li>
                <li><a href="#">Digital Preservation</a></li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </li>
    <li><a href="#">Collections</a></li>
    <li><a href="#">About</a></li>
  </ul>
</cork-nav-sub-popover>
`;