'use strict';

import AxiosError from '../core/AxiosError.js';

class CanceledError extends AxiosError {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   * @param {Object|string=} reason The reason.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request, reason) {
    super(message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
    this.reason = reason;
    this.__CANCEL__ = true;
  }
}

export default CanceledError;
