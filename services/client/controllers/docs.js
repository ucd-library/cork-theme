import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

import logger from '../dev/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @description Serves the repo's docs/ folder as markdown at /docs/, keeping its folder structure.
 * @param {import('express').Application} app - The Express application instance
 */
export default (app) => {
  const docsDir = path.join(__dirname, '../../../docs');
  logger.info(`Serving docs from ${docsDir}`);

  app.use('/docs',
    express.static(docsDir, {
      index: ['readme.md'],
      setHeaders: (res, filePath) => {
        if ( filePath.endsWith('.md') ) res.set('Content-Type', 'text/markdown; charset=utf-8');
      }
    }),
    (req, res) => res.status(404).type('text/plain').send('Not found')
  );
};
