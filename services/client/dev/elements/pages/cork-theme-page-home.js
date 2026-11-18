import { LitElement } from 'lit';
import {render, styles} from "./cork-theme-page-home.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

export default class CorkThemePageHome extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElementMixin) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.features = [
      {
        title: 'Official UC Davis Styles',
        description: 'UC Davis Sitefarm styles are an upstream dependency for Cork Theme, so you can be sure that your site will be consistent with the rest of the campus.',
        icon: 'fab.css'
      },
      {
        title: 'Prebuilt',
        description: 'Styles come compiled and JavaScript is self-contained, so you can start building as soon as the package is installed. If you need to customize, the Sass source is there for your own build.',
        icon: 'fas.box-open'
      },
      {
        title: 'Platform Agnostic',
        description: 'Standard web components work in any app, whatever the framework or server: Lit, React, Wordpress, or a plain HTML page. Add the stylesheet and script, and the markup does the rest.',
        icon: 'fas.laptop-code'
      },
      {
        title: 'AI Agent Support',
        description: 'Every element, controller and utility is documented, with examples, in reference docs generated from the source. Your AI assistant can read how things really work rather than guessing.',
        icon: 'fas.robot'
      },
      {
        title: 'A Full Toolkit, If You Want It',
        description: 'Use the components on their own, or adopt the rest of the UC Davis Library\'s SPA stack: Lit, a data and state model, client-side routing with Express middleware to match, and icon management, all designed to work together.',
        icon: 'fas.layer-group'
      }
    ];
  }

}

customElements.define('cork-theme-page-home', CorkThemePageHome);