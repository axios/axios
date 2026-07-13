'use strict';

import utils from '../utils.js';

const $interceptorId = Symbol('interceptorId');

class InterceptorManager {
  constructor() {
    this.handlers = [];
    this.nextId = 0;
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
    const id = this.nextId++;

    this.handlers.push({
      [$interceptorId]: id,
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
    const index = this.handlers.findIndex(function findHandler(h) {
      return h[$interceptorId] === id;
    });

    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
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
    utils.forEach(this.handlers, function forEachHandler(h) {
      fn(h);
    });
  }
}

export default InterceptorManager;
