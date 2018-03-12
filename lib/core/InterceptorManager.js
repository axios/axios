'use strict';

function InterceptorManager() {
  this.handlers = {};
  this.count = 0;
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers[this.count] = {
    fulfilled: fulfilled,
    rejected: rejected
  };
  this.count++;
  return this.count - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    delete this.handlers[id];
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  var i;
  var handler;
  for (i = 0; i < this.count; i++) {
    handler = this.handlers[i];
    if (handler !== undefined) {
      fn(handler);
    }
  }
};

module.exports = InterceptorManager;
