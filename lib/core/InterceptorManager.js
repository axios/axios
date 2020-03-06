'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add (Append) a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    // Parse id as a number to make sure it is
    var _id = Number(id);
    // Create a buffer handlers stack
    var buf = [];
    // Iterate over the handlers stack and filter out the interceptor in the stack with "id"
    utils.forEach(this.handlers, function forEachHandler(h, i) {
      // Only push if the "i" is not equal to "_id"
      if (_id !== i) {
        buf.push(h);
      }
    });
    // Set buffer to the handlers stack
    this.handlers = buf;
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
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

/**
 * Clear all interceptors from the stack
 */
InterceptorManager.prototype.clear = function clear() {
  this.handlers = [];
};

module.exports = InterceptorManager;
