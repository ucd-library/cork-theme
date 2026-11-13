import {BaseModel} from '@ucd-lib/cork-app-utils';
import DocService from '../services/DocService.js';
import DocStore from '../stores/DocStore.js';

class DocModel extends BaseModel {

  constructor() {
    super();

    this.store = DocStore;
    this.service = DocService;
      
    this.register('DocModel');
  }

  /**
   * @description Get a documentation object by path
   * @param {String} path - The path to the documentation object
   * @returns {Promise}
   */
  async get(path) {
    return this.service.get(path);
  }

}

const model = new DocModel();
export default model;