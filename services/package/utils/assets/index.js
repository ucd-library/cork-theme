import imageProperties from '../../styles/image-properties.js';
import fontFaces from '../../styles/font-faces.js';

/**
 * @description Wraps a URL in a CSS url() value, escaping double quotes.
 * @param {String} url - Image URL or data URI.
 * @returns {String} e.g. 'url("/images/bar.webp")'
 */
export function cssUrl(url) {
  return `url("${url.replace(/"/g, '%22')}")`;
}

/**
 * @description Value for an element-level --cork-image-* override, for use with Lit's styleMap. Images come from those
 * custom properties (see setImageCssCustomProperties); an unset override returns undefined, which styleMap leaves out,
 * so the document's value applies.
 * @param {String} url - Override image URL, if any.
 * @returns {String|undefined} e.g. 'url("/images/bar.webp")', or undefined if no URL.
 */
export function optionalCssUrl(url) {
  return url ? cssUrl(url) : undefined;
}

/**
 * @description Points the theme's large images at a host or directory, by setting each --cork-image-* custom css property. 
 * @param {String} host - Base URL of the images, e.g. '/images/cork-theme' or 'https://cdn.example.edu/images'.
 * Holds the files copied by `npx cork-theme copy-images`.
 * @param {Object} opts - Options.
 * @param {HTMLElement} opts.element - Element to set the properties on. Default: document.documentElement.
 * @returns {Object} The properties set, keyed by name.
 */
export function setImageCssCustomProperties(host, opts={}) {
  const element = opts.element || document.documentElement;
  const base = host.replace(/\/+$/, '');
  const set = {};
  for ( const { property, file } of imageProperties ) {
    set[property] = cssUrl(`${base}/${file}`);
    element.style.setProperty(property, set[property]);
  }
  return set;
}

/**
 * @description Loads the theme fonts from a host using the FontFace API.
 * @param {String} host - Base URL of the fonts, e.g. '/fonts/cork-theme'. 
 * Holds the files copied by `npx cork-theme copy-fonts`.
 * @param {Object} opts - Options.
 * @param {FontFaceSet} opts.fontFaceSet - Where to add the faces. Default: document.fonts.
 * @returns {FontFace[]} The faces added. Each loads when the page first uses it.
 */
export function setFontFaces(host, opts={}) {
  const fontFaceSet = opts.fontFaceSet || document.fonts;
  const base = host.replace(/\/+$/, '');
  return fontFaces.map(({ family, src, ...descriptors }) => {
    const source = src.map(({ path, format }) => `${cssUrl(`${base}/${path}`)} format("${format}")`).join(', ');
    const face = new FontFace(family, source, descriptors);
    fontFaceSet.add(face);
    return face;
  });
}
