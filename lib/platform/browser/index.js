'use strict';

module.exports = {
  isBrowser: true,
  classes: {
    URLSearchParams: require('./classes/URLSearchParams'),
    FormData: require('./classes/FormData'),
    Blob: Blob
  },
  protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
};
