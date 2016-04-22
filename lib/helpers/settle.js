'use strict';

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  // Note: status is not exposed by XDomainRequest
  if (!response.status || (response.status >= 200 && response.status < 300)) {
    resolve(response);
  } else {
    reject(response);
  }
};
