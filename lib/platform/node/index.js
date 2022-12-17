import URLSearchParams from "./classes/URLSearchParams.js";
import FormData from "./classes/FormData.js";
import AbortController from "./classes/AbortController.js";
import {Request, Response, Headers} from "./classes/FetchAPI.js";

export default {
  isNode: true,
  knownAdapters: ['http', 'fetch'],
  classes: {
    URLSearchParams,
    FormData,
    Request,
    Response,
    Headers,
    AbortController,
    Blob: typeof Blob !== 'undefined' && Blob || null
  },
  protocols: [ 'http', 'https', 'file', 'data' ]
};
