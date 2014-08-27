'use strict';


function isArrayLike(obj) {
  return obj.constructor === Array || typeof obj.callee === 'function';
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array or arguments callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
module.exports = function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  var isArray = isArrayLike(obj);

  // Force an array if not already something iterable
  if (typeof obj !== 'object' && !isArray) {
    obj = [obj];
  }

  // Iterate over array values
  if (isArray) {
    for (var i=0, l=obj.length; i<l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  }
  // Iterate over object keys
  else {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
};