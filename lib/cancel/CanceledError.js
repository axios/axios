'use strict';

var AxiosError = require('../core/AxiosError');
var utils = require('../utils');

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 * @param {any=} config The config.
 */
function CanceledError(message, config) {
  // eslint-disable-next-line no-eq-null
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config);
  this.name = 'CanceledError';
}

utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

module.exports = CanceledError;
