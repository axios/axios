'use strict';

import AxiosError from '../core/AxiosError.js';

class CanceledError extends AxiosError {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   * @param {*=} cause The abort reason or original cause.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request, cause) {
    super(message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
    this.__CANCEL__ = true;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export default CanceledError;
