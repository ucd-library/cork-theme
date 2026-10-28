import {createLogger} from '@ucd-lib/logger';

const logger = createLogger({
  name: process.env.APP_LOGGER_NAME || 'cork-theme-app'
});

export default logger;
