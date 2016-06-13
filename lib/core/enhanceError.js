'use strict';

/**
 * Update an Error with the specified config and optional error code.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config object.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code) {
  error.config = config;
  if (code) {
    error.code = code;
  }
  return error;
};
