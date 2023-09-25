import URLSearchParams from './classes/URLSearchParams.js';
import FormData from './classes/FormData.js';
import AbortController from './classes/AbortController.js';
import {Request, Response, Headers} from './classes/FetchAPI.js';

// Exports for a generic Fetch API-supporting JS environment.
export default {
  isGenericJs: true,
  isStandardBrowserEnv: false,
  knownAdapters: ['fetch'],
  defaultFetchOptions: {
    redirect: 'follow'
  },
  classes: {
    URLSearchParams,
    FormData,
    Request,
    Response,
    Headers,
    AbortController,
    Blob: typeof Blob !== 'undefined' && Blob || null
  },
  protocols: ['http', 'https', 'blob', 'url', 'data']
};
