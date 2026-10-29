import express from 'express';

import {logReqMiddleware} from '@ucd-lib/logger';

import staticRoutes from './controllers/static.js';
import config from './dev/lib/config.js';
import logger from './dev/lib/logger.js';
import { middleware as contextMiddleware } from './dev/lib/context.js';

/**
 * @description Allows any origin to load the app's responses, so other apps can use the fonts and stylesheets it hosts.
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {Function} next - Calls the next middleware
 */
const corsMiddleware = (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
};

const app = express();
app.use(corsMiddleware);
app.use(logReqMiddleware(logger));
app.use(contextMiddleware);
staticRoutes(app);

app.listen(config.app.containerPort, () => {
  config.logSummary('Server started');
});