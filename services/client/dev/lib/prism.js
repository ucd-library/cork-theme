import './prism-manual.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-scss.js';
import 'prismjs/components/prism-docker.js';
// highlights html and css inside Lit's html`` and css`` templates
import 'prismjs/components/prism-js-templates.js';

/**
 * @description Highlights code with Prism, for the languages loaded above (and their aliases, e.g. js, html, dockerfile).
 * @param {String} code - The code to highlight.
 * @param {String} lang - The code's language, e.g. from a markdown fence.
 * @returns {String} Highlighted HTML, or the code unchanged (not escaped) if the language is missing or not loaded.
 */
export function highlight(code, lang) {
  const grammar = lang && Prism.languages[lang];
  if ( !grammar ) return code;
  return Prism.highlight(code, grammar, lang);
}

export default Prism;
