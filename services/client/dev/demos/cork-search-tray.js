import '@ucd-lib/cork-theme/elements/cork-search-tray';
import '@ucd-lib/cork-theme/elements/cork-search-form';
import '@ucd-lib/cork-theme/elements/cork-search-common';

// Starting markup for the cork-search-tray demo
export default `
<cork-search-tray>
  <cork-search-form>
    <button name="news">News</button>
  </cork-search-form>
  <cork-search-common>
    <a href="#">Hours</a>
  </cork-search-common>
</cork-search-tray>
`;
