import { LruStore } from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class DocStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      get: new LruStore({name: 'doc.get'})
    };
    this.events = {};
  }

}

const store = new DocStore();
export default store;