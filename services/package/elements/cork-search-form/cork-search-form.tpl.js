import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';

import normalizeCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_normalize.css.js';
import formsCss from '@ucd-lib/cork-theme/styles/js/1_base_html/_forms.css.js';
import categoryBrandCss from '@ucd-lib/cork-theme/styles/js/4_component/_category-brand.css.js';
import searchFormCss from '@ucd-lib/cork-theme/styles/js/4_component/_search-form.css.js';
import uVisibilityCss from '@ucd-lib/cork-theme/styles/js/6_utility/_u-visibility.css.js';

/**
 * @description Styles for the cork-search-form element.
 * @returns {Array} Lit css results.
 */
export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
    [hidden]{
      display: none !important;
    }
  `;

  return [
    normalizeCss,
    formsCss,
    categoryBrandCss,
    searchFormCss,
    uVisibilityCss,
    elementStyles
  ];
}

/**
 * @description Main render function for the cork-search-form element. Facets render as submit buttons, so the browser
 * reports which one was used (e.submitter, or name=value in a native submit).
 * @returns {TemplateResult}
 */
export function render() {

  const formClasses = {
    'search-form': true,
    'inline-form': true
  };
  if ( this.categoryBrand ){
    formClasses['category-brand__background'] = true;
    formClasses['category-brand--' + this.categoryBrand] = true;
  }
  return html`
  <form 
    @submit=${this._onSubmit}
    action=${ifDefined(this.formAction)} 
    method=${ifDefined(this.formMethod)} 
    class=${classMap(formClasses)}>
      <div class="search-form__input-wrapper">
        <label for="search-field" class="u-hidden--visually">${this.labelText}</label>
        <input type="text" placeholder=${ifDefined(this.placeholder)} id="search-field" class="search-form__input" name=${this.queryParam} .value=${this.value} @input=${this._onInput}>
        <input type="submit" class="search-form__submit" name=${this.submitParam} aria-label=${this.submitAriaLabel} value="Submit">
      </div>
      <div class="search-form__buttons" ?hidden=${!this._facets.length}>
        ${this._facets.map((facet) => html`
          <input type="submit" class="search-form__btn" name=${facet.name} value=${facet.value || facet.label} aria-label=${ifDefined(facet.ariaLabel)}>
        `)}
      </div>
  </form>
  `;
}