import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    cork-theme-page-element-single {
      display: block;
    }
    cork-theme-element-demo {
      margin-top: 1rem;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <section>
      <h1 class="page-title">${this.elementTag}</h1>
    </section>
    <ol class="breadcrumbs ">
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/elements">Elements</a>
      </li>
      <li>
        ${this.elementTag}
      </li>
    </ol>
    <div class="breadcrumbs__dots"></div>
    <div class="l-container">
      <div class="l-content">
        ${this.ctl.markdown.renderIntro()}
        <h2>Interactive Demo</h2>
        ${renderDemo.call(this)}
        ${this.ctl.markdown.render({ stripTopHeading: true, stripIntro: true })}
      </div>
    </div>
  `;
}

/**
 * @description Renders the live demo for the current element, if it has a demo module.
 * @returns {TemplateResult|String}
 */
function renderDemo(){
  const demo = this.demos[this.elementTag];
  if ( !demo ) return '';
  return html`
    <cork-theme-element-demo
      .manifest=${this.manifest}
      .only=${[this.elementTag]}
      selected=${this.elementTag}
      .markup=${demo.default}
      .hiddenKnobs=${demo.hiddenKnobs || []}
      background=${demo.background || ''}>
    </cork-theme-element-demo>
  `;
}
