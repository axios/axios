'use strict';

import utils from '../utils.js';

class InterceptorManager {
  constructor() {
    this.handlers = [];
    this.activeHandlers = new Set(); // Track active handler indices
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
    const handler = {
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null,
    };
    this.handlers.push(handler);
    const id = this.handlers.length - 1;
    this.activeHandlers.add(id);
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
    if (this.activeHandlers.has(id)) {
      this.activeHandlers.delete(id);
      // Mark as null to allow GC
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers = [];
    this.activeHandlers.clear();
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    this.activeHandlers.forEach(id => {
      if (this.handlers[id] !== null) {
        fn(this.handlers[id]);
      }
    });
  }
}

export default InterceptorManager;
