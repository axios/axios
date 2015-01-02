// This file exports various custom errors

/**
 * When the server response is not 2xx
 *
 * @param {Object} response The full http response
 */
function BadStatusCodeError(response) {
  Error.captureStackTrace(this);
  this.response = response;
  this.name = 'BadStatusCodeError';
}

BadStatusCodeError.prototype = Object.create(Error.prototype);

module.exports = {
  BadStatusCodeError: BadStatusCodeError
};
