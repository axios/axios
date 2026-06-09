'use strict';

import AxiosError from '../core/AxiosError.js';

class CanceledError extends AxiosError {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request) {
    super(message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
    this.__CANCEL__ = true;
  }

  static from(err, code, ...args) {
    if(err instanceof CanceledError) {
      return err;
    }

    // Avoid coping unappropriated DOMException code
    if (err instanceof Error && err.name === 'AbortError') {
      return new this(err.message, null, ...args);
    }

    return super.from(err, code, ...args);
  }
}

export default CanceledError;
