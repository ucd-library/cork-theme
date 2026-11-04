#!/usr/bin/env node
import { parseArgs } from 'util';

import { copyImages, copyFonts } from '../utils/assets/copy.js';

const USAGE = `Usage: cork-theme <command> <dest> [--all]

Commands:
  copy-images <dest>  Copy the theme's hosted images to <dest>, for setImageCssCustomProperties()
    --all             Copy every image instead, for apps that compile the package's Sass themselves.
                      Serve <dest> as an images/ folder next to the compiled CSS.
  copy-fonts <dest>   Copy the theme fonts (Proxima Nova, Ryman Eco) to <dest>, for setFontFaces()

Example (Dockerfile):
  RUN npx cork-theme copy-images ./public/images/cork-theme`;

const COMMANDS = {
  'copy-images': { copy: copyImages, noun: 'images', fn: 'setImageCssCustomProperties' },
  'copy-fonts': { copy: copyFonts, noun: 'font files', fn: 'setFontFaces' }
};

/**
 * @description Runs the cork-theme CLI: copies the theme's images or fonts into an app at build time.
 * @returns {Promise<void>}
 */
async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean', short: 'h' },
    all: { type: 'boolean' }
  } });
  const [command, dest] = positionals;

  if ( values.help ) {
    console.log(USAGE);
    return;
  }
  if ( !COMMANDS[command] || !dest ) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const { copy, noun, fn } = COMMANDS[command];
  const copied = await copy(dest, { all: values.all });
  console.log(`Copied ${copied.length} ${noun} to ${dest}.`);
  if ( values.all && command === 'copy-images' ) {
    console.log('Serve it as an images/ folder next to your compiled CSS, which loads images from ../images/.');
    return;
  }
  // Guess the URL from a public/ folder, the usual static root; otherwise leave a placeholder
  const publicPath = dest.replace(/\\/g, '/').split('/public/')[1]?.replace(/\/+$/, '');
  const url = publicPath ? `/${publicPath}` : '<URL that serves this folder>';
  console.log(`In your app: import { ${fn} } from '@ucd-lib/cork-theme/utils/assets'; ${fn}('${url}');`);
}

main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
