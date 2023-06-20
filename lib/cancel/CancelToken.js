'use strict';

import CanceledError from './CanceledError.js';

/**
 * Represents a `CancelToken` object that can be used to request cancellation of an operation.
 * @class
 * @param {Function} executor - The executor function.
 * @returns {CancelToken} - Returns a new instance of `CancelToken`.
 * @throws {TypeError} - Throws an error if the `executor` parameter is not a function.
 * @remarks - This class provides methods to subscribe and unsubscribe from the cancel signal, and to throw a `CanceledError` if cancellation has been requested. It also provides a static method `source()` that returns an object containing a new `CancelToken` and a function that, when called, cancels the `CancelToken`.
 */
class CancelToken {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    let resolvePromise;

    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    const token = this;

    // eslint-disable-next-line func-names
    this.promise.then(cancel => {
      if (!token._listeners) return;

      let i = token._listeners.length;

      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });

    // eslint-disable-next-line func-names
    this.promise.then = onfulfilled => {
      let _resolve;
      // eslint-disable-next-line func-names
      const promise = new Promise(resolve => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);

      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };

      return promise;
    };

    executor(function cancel(message, config, request) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new CanceledError(message, config, request);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }

  /**
   * Subscribe to the cancel signal
   */

  /**
   * Adds a listener to the event. If the event has already occurred, the listener is immediately called with the event reason.
   * @param {function} listener - The function to be called when the event occurs.
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }

    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }

  /**
   * Unsubscribe from the cancel signal
   */

  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   * @returns {{token: CancelToken, cancel: function}} An object containing a new `CancelToken` and a function that cancels the `CancelToken`.
   * @remarks The `CancelToken` can be used to cancel an asynchronous request or operation.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}

export default CancelToken;
