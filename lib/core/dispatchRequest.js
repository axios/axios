'use strict';

/**
 * Dispatch a request to the server using whichever adapter
 * is supported by the current environment.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  return new Promise(function (resolve, reject) {
    try {
      // For browsers use XHR adapter
      if (typeof window !== 'undefined') {
        require('../adapters/xhr')(resolve, reject, config);
      }
      // For node use HTTP adapter
      else if (typeof process !== 'undefined') {
        require('../adapters/http')(resolve, reject, config);
      }
    } catch (e) {
      reject(e);
    }
  });
};

