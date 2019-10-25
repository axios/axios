'use strict';

/**
 * Determines whether the given error means that the request has timed out
 *
 * @param {any} error The error to test
 * @returns {boolean} True if error is caused by axios time out, otherwise false.
 */
module.exports = function isTimeout(error) {
  return !!error.axiosTimeout;
};
