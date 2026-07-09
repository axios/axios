'use strict';

const $idCounter = Symbol('idCounter');

class InterceptorManager {
  constructor() {
    this.handlers = new Map();
    this[$idCounter] = 0;
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    const id = this[$idCounter]++;
    this.handlers.set(id, {
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null,
    });
    return id;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    if (this.handlers.has(id)) {
      this.handlers.delete(id);
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers.clear();
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    const handlers = this.handlers;
    // Snapshot keys to preserve the original length behavior (avoid visiting handlers registered during iteration)
    // and dynamically look them up to safely skip handlers ejected mid-iteration.
    const keys = Array.from(handlers.keys());
    keys.forEach(function forEachHandler(key) {
      const h = handlers.get(key);
      if (h !== undefined) {
        fn(h);
      }
    });
  }
}

export default InterceptorManager;
