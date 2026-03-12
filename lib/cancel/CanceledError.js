'use strict';

import AxiosError from '../core/AxiosError.js';

class CanceledError extends AxiosError {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   * @param {*=} reason The reason for cancellation.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request, reason) {
    // Use reason as message if message is null and reason is a string
    if (message == null && typeof reason === 'string') {
      message = reason;
    } else if (message == null && reason instanceof Error) {
      message = reason.message;
    }
    
    super(message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
    this.__CANCEL__ = true;
    this.reason = reason;
  }
}

export default CanceledError;
