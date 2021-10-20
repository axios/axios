'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  var validateData = response.config.validateData;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    if (!response.data || !validateData || validateData(response.data)) {
      resolve(response);
    } else {
      reject(createError(
        'Request failed with invalid data',
        response.config,
        response.status,
        response.request,
        response
      ));
    }
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};
