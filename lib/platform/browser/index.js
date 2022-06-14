import URLSearchParams from './classes/URLSearchParams.js'
import FormData from './classes/FormData.js'

export default {
  isBrowser: true,
  classes: {
    URLSearchParams,
    FormData,
    Blob
  },
  protocols: ['http', 'https', 'file', 'blob', 'url']
};
