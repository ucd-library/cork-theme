import { html, css } from 'lit';

import { toGridRows } from '@ucd-lib/cork-theme/utils/layout';
import '@ucd-lib/cork-theme/elements/cork-markdown';

import { highlightExtension } from '../../lib/prism.js';

// Get Started instructions. The hosted URLs are placeholders until the hosted build exists.
const GET_STARTED = [
  'Install the package, for apps with a build step:',
  '```bash',
  'npm install @ucd-lib/cork-theme',
  '```',
  '```js',
  "import '@ucd-lib/cork-theme/elements/cork-header';",
  '```',
  'Or add it straight to a page:',
  '```html',
  '<!-- TODO: Replace with actual hosted URLs -->',
  '<link rel="stylesheet" href="https://cork-theme.library.ucdavis.edu/css/style-ucdlib.css">',
  '<script type="module" src="https://cork-theme.library.ucdavis.edu/js/cork-theme.js"></script>',
  '```',
  'Then just add the markup:',
  '```html',
  '<cork-header>',
  '  <cork-primary-nav>',
  '    <a href="/">Home</a>',
  '    <a href="/about">About</a>',
  '  </cork-primary-nav>',
  '</cork-header>',
  '```'
].join('\n');

export function styles() {
  const elementStyles = css`
    cork-theme-page-home {
      display: block;
    }
    cork-theme-page-home .feature-teaser {
      --cork-icon-size: 3rem;
      margin-bottom: 2rem;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div class="layout-section l-container u-space-my--huge">
        <div class="l-1col">
          <div class="panel">
            <div class="alignable-promo">
              <div class="alignable-promo__wrapper">
                <div class="alignable-promo__body">
                  <h2 class="alignable-promo__title"><span class="alignable-promo__line1">Build UC Davis-branded applications quickly with Cork Theme</span></h2>
                  <div class="alignable-promo__text">
                    <p>Branded web components that work anywhere: styles built in, JavaScript self-contained, and documented well enough that you and your AI assistant can get it right the first time.</p>
                  </div>
                  <div class="alignable-promo__buttons">
                    <a href="#" class="btn btn--primary btn--round">Get Started</a>
                    <a href="#" class="btn btn--invert  btn--round">I'm a robot!</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    

    <div class="layout-section l-container--edge layout-section--pinot layout-section--force-contrast l-gutter u-space-py--huge">
      <h2 class="heading--center-underline u-space-mb--large"><span class="heading--weighted--weighted">Key Features</span></h2>
      ${toGridRows(this.features,3).map(row => html`
        <div class=${row.class}>
          ${row.columns.map(column => html`
            <div class=${column.class}>
              <div class='feature-teaser'>
                <cork-icon icon=${column.item.icon}></cork-icon>
                <h3 class="h4 u-space-mt--flush">${column.item.title}</h3>
                <div>${column.item.description}</div>
              </div>
            </div>
          `)}
        </div>
      `)}
    </div>

    <div class="layout-section l-container u-space-my--huge">
      <div class="l-2col l-2col--33-67">
        <div class="l-first">
          <h2 class='h4'>Documentation</h2>
          <div>
            <a href="/elements" class="focal-link category-brand--secondary ">
              <div class="focal-link__figure focal-link__icon">
                <cork-icon icon="fas.code"></cork-icon>
              </div>
              <div class="focal-link__body">
                <strong>Elements</strong>
              </div>
            </a>
          </div>
          <div>
            <a href="#" class="focal-link category-brand--secondary ">
              <div class="focal-link__figure focal-link__icon">
                <cork-icon icon="fab.css"></cork-icon>
              </div>
              <div class="focal-link__body">
                <strong>Styles</strong>
              </div>
            </a>
          </div>
          <div>
            <a href="/utils" class="focal-link category-brand--secondary ">
              <div class="focal-link__figure focal-link__icon">
                <cork-icon icon="fas.toolbox"></cork-icon>
              </div>
              <div class="focal-link__body">
                <strong>Utilities</strong>
              </div>
            </a>
          </div>
          <div>
            <a href="#" class="focal-link category-brand--secondary ">
              <div class="focal-link__figure focal-link__icon">
                <cork-icon icon="fas.puzzle-piece"></cork-icon>
              </div>
              <div class="focal-link__body">
                <strong>Extensions</strong>
              </div>
            </a>
          </div>
        </div>
        <div class="l-second">
          <h2 class="heading--weighted-underline"><span class='heading--weighted--weighted'>Get Started</span></h2>
          <cork-markdown .markdown=${GET_STARTED} .markedOptions=${highlightExtension}></cork-markdown>
          <a href="#" class="btn btn--primary btn--round">More Information</a>
        </div>
      </div>
    </div>

  `;
}