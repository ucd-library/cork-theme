import { clearCache } from '@ucd-lib/cork-app-utils';

const defaultOpts = { 
  skipModels: ['IconModel', 'AppStateModel']
};

export default (opts={}) => {
  clearCache({ ...defaultOpts, ...opts });
}