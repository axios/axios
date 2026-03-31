import URLSearchParams from './classes/URLSearchParams.js';
import FormData from './classes/FormData.js';
import Blob from './classes/Blob.js';
import util from "util";

export default {
  isBrowser: true,
  classes: {
    URLSearchParams,
    FormData,
    Blob,
    TextEncoder: (typeof TextEncoder !== 'undefined' && TextEncoder)
  },
  protocols: ['http', 'https', 'file', 'blob', 'url', 'data'],
};
