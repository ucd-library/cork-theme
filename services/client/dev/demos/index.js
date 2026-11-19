/**
 * @file Demo modules for the element demos on each element's page, keyed by tag name.
 * Each module's default export is the demo's starting markup. It can also export hiddenKnobs, an array of property names
 * to leave out of the demo's knobs, and background, a CSS background for the demo area, e.g. 'var(--ucd-blue)'. Each module imports its element, and any elements its markup uses, so they're defined before the demo renders.
 */
import * as corkBrandingBar from './cork-branding-bar.js';
import * as corkHeader from './cork-header.js';
import * as corkMarkdown from './cork-markdown.js';
import * as corkNavLite from './cork-nav-lite.js';
import * as corkNavSub from './cork-nav-sub.js';
import * as corkPager from './cork-pager.js';
import * as corkNavSubPopover from './cork-nav-sub-popover.js';
import * as corkPages from './cork-pages.js';
import * as corkPrimaryNav from './cork-primary-nav.js';
import * as corkQuickLinks from './cork-quick-links.js';
import * as corkSearchCommon from './cork-search-common.js';
import * as corkSearchForm from './cork-search-form.js';
import * as corkSearchTray from './cork-search-tray.js';

export default {
  'cork-branding-bar': corkBrandingBar,
  'cork-header': corkHeader,
  'cork-markdown': corkMarkdown,
  'cork-nav-lite': corkNavLite,
  'cork-nav-sub': corkNavSub,
  'cork-pager': corkPager,
  'cork-nav-sub-popover': corkNavSubPopover,
  'cork-pages': corkPages,
  'cork-primary-nav': corkPrimaryNav,
  'cork-quick-links': corkQuickLinks,
  'cork-search-common': corkSearchCommon,
  'cork-search-form': corkSearchForm,
  'cork-search-tray': corkSearchTray
};
