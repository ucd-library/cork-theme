import express from 'express';

import {logReqMiddleware} from '@ucd-lib/logger';

import staticRoutes from './controllers/static.js';
import config from './dev/lib/config.js';
import logger from './dev/lib/logger.js';
import { middleware as contextMiddleware } from './dev/lib/context.js';

const app = express();
app.use(logReqMiddleware(logger));
app.use(contextMiddleware);
staticRoutes(app);

app.listen(config.app.containerPort, () => {
  config.logSummary('Server started');
});