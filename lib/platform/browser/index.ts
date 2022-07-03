import URLSearchParams from './classes/URLSearchParams'
import FormData from './classes/FormData'

export default {
  isBrowser: true,
  classes: {
    URLSearchParams,
    FormData,
    Blob
  },
  protocols: ['http', 'https', 'file', 'blob', 'url']
};
