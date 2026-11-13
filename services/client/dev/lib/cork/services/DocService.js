import {BaseService} from '@ucd-lib/cork-app-utils';
import DocStore from '../stores/DocStore.js';

import payload from '../utils/payload.js';

class DocService extends BaseService {

  constructor() {
    super();
    this.store = DocStore;
  }

  /**
   * @description Base URL for field API endpoints.
   * @returns {string}
   */
  get baseUrl(){
    return `/docs`;
  }

  /**
   * @description Retrieves a documentation object
   * @param {string} path - The path to the documentation object
   * @returns {Promise<object>} Store state object for the request.
   */
  async get(path){
    const ido = { path };
    const id = payload.getKey(ido);
    const store = this.store.data.get;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get documentation'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          payload.generate(ido, resp),
          store,
          null,
          appStateOptions
        )
      })
    );

    return store.get(id);
  }

}

const service = new DocService();
export default service;