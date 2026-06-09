import URLSearchParams from './classes/URLSearchParams.js';
import FormData from './classes/FormData.js';
import Blob from './classes/Blob.js';

const browserExport = {
  isBrowser: true,
  classes: {
    URLSearchParams,
    FormData,
    Blob,
    TextEncoder: typeof TextEncoder !== 'undefined' && TextEncoder
  },
  protocols: ['http', 'https', 'file', 'blob', 'url', 'data'],
};

if (browserExport.classes.TextEncoder) {
  browserExport.toBase64 = (str) => btoa(
    String.fromCharCode(...new TextEncoder().encode(str))
  )
}

export default browserExport;
