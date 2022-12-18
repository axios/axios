import URLSearchParams from './classes/URLSearchParams.js'
import FormData from './classes/FormData.js'
import Blob from './classes/Blob.js'
import {Request, Response, Headers} from './classes/FetchAPI.js';

export default {
  isBrowser: true,
  isGenericJs: true,  // browser is a superset of generic JS
  knownAdapters: ['xhr', 'fetch'],
  defaultFetchOptions: {
    cache: 'default',
    redirect: 'follow'
  },
  classes: {
    URLSearchParams,
    FormData,
    Blob,
    Request,
    Response,
    Headers
  },
  protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
};
