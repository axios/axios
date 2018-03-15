'use strict'

const enhanceError = require('./enhanceError')
const AxiosError = require('./AxiosError')

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError (message, config, code, request, response) {
  const error = new AxiosError(message)
  return enhanceError(error, config, code, request, response)
}
