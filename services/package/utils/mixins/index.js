/**
 * @file Mixin classes for theme elements and your own Lit components. 
 * 
 * Apply during class definition with the `with()` function:
 * 
 * @example
 * import { LitElement } from 'lit';
 * import { Mixin, MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';
 * class MyElement extends Mixin(LitElement).with(MainDomElementMixin) {}
 */

import Mixin from './mixin.js';
import MainDomElementMixin from './MainDomElementMixin.js';

export {
  Mixin, 
  MainDomElementMixin
};