import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

import logger from '../dev/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @description Serves the theme's images and fonts straight from the package, for this app and for other apps that
 * point setImageCssCustomProperties() / setFontFaces() (or styles/css/fonts.css) at it:
 * /images from styles/images, and /fonts from styles/ucdlib-fonts (Proxima Nova) and styles/fonts (campus's).
 * Missing files get a plain 404 rather than the SPA page.
 * @param {import('express').Application} app - The Express application instance
 */
export default (app) => {
  const stylesDir = path.join(__dirname, '../../package/styles');
  logger.info(`Serving images and fonts from ${stylesDir}`);

  const notFound = (req, res) => res.status(404).type('text/plain').send('Not found');

  app.use('/images',
    express.static(path.join(stylesDir, 'images'), { index: false }),
    notFound
  );
  app.use('/fonts',
    express.static(path.join(stylesDir, 'ucdlib-fonts'), { index: false }),
    express.static(path.join(stylesDir, 'fonts'), { index: false }),
    notFound
  );
};
