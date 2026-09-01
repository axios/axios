'use strict';

import AxiosError from '../core/AxiosError.js';

class CanceledError extends AxiosError {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   * @param {*} [cause] What triggered the cancellation, typically an
   *   `AbortSignal.reason`. Installed non-enumerable to match native `Error`
   *   `cause` semantics, so a reason carrying circular internals cannot break
   *   structured loggers or any own-property walk.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request, cause) {
    super(message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
    this.name = 'CanceledError';
    this.__CANCEL__ = true;

    if (cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        __proto__: null,
        value: cause,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
  }
}

export default CanceledError;
