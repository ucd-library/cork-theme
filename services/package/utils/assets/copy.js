import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import imageProperties from '../../styles/image-properties.js';
import fontFaces from '../../styles/font-faces.js';

// Node only: copies the theme's hosted images and fonts into an app, for setImageCssCustomProperties() and setFontFaces().
const STYLES_DIR = fileURLToPath(new URL('../../styles/', import.meta.url));
// Font folders, in lookup order: ours (Proxima Nova), then campus's
const FONT_DIRS = ['ucdlib-fonts', 'fonts'];

/**
 * @description Copies the images listed in styles/image-properties.js to a directory, for an app to serve and
 * pass to setImageCssCustomProperties().
 * @param {String} dest - Directory to copy into. Created if needed.
 * @param {Object} opts - Options (none yet).
 * @returns {Promise<String[]>} Paths of the copied files.
 */
export async function copyImages(dest, opts={}) {
  const files = imageProperties.map(({ file }) => ({ from: path.join(STYLES_DIR, 'images', file), to: file }));
  return copyFiles(files, dest);
}

/**
 * @description Copies the font files listed in styles/font-faces.js (Proxima Nova and Ryman Eco) to a directory,
 * keeping their relative paths, for an app to serve and pass to setFontFaces().
 * @param {String} dest - Directory to copy into. Created if needed.
 * @param {Object} opts - Options (none yet).
 * @returns {Promise<String[]>} Paths of the copied files.
 */
export async function copyFonts(dest, opts={}) {
  const files = [];
  for ( const { path: fontPath } of fontFaces.flatMap(face => face.src) ) {
    files.push({ from: await findFont(fontPath), to: fontPath });
  }
  return copyFiles(files, dest);
}

/**
 * @description Finds a font file in the package's font folders.
 * @param {String} fontPath - Path relative to a font folder, e.g. 'proximanova/proximanova-bold-webfont.woff2'.
 * @returns {Promise<String>} Absolute path.
 */
async function findFont(fontPath) {
  for ( const dir of FONT_DIRS ) {
    const file = path.join(STYLES_DIR, dir, fontPath);
    try {
      await fs.access(file);
      return file;
    } catch (e) {}
  }
  throw new Error(`Font ${fontPath} not found in the package`);
}

/**
 * @description Copies files into a directory, creating subdirectories as needed.
 * @param {Object[]} files - Each { from, to }: an absolute source path, and a path relative to dest.
 * @param {String} dest - Directory to copy into.
 * @returns {Promise<String[]>} Paths of the copied files.
 */
async function copyFiles(files, dest) {
  if ( !dest ) throw new Error('A destination directory is required');
  const copied = [];
  for ( const { from, to } of files ) {
    const target = path.join(dest, to);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(from, target);
    copied.push(target);
  }
  return copied;
}
