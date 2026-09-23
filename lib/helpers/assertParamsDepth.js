'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');

// Match numeric array reads without scanning unoccupied slots or metadata.
function arrayIndexes(array) {
  var length = array.length;
  var indexes = Object.create(null);
  var keys = [];
  var source = array;
  var fast = array;
  while (source) {
    var names = Object.getOwnPropertyNames(source);
    for (var i = 0; i < names.length; i++) {
      var key = names[i];
      var index = +key;
      if (index >= 0 && index < length && Math.floor(index) === index &&
        String(index) === key && !indexes[key]) {
        indexes[key] = true;
        keys.push(key);
      }
    }
    source = Object.getPrototypeOf(source);
    // Detect unusual cyclic prototype chains with constant memory.
    fast = fast && Object.getPrototypeOf(fast);
    fast = fast && Object.getPrototypeOf(fast);
    if (source && source === fast) {
      throw new AxiosError('Circular prototype chain in params', AxiosError.ERR_BAD_OPTION_VALUE);
    }
  }
  return keys.sort(function(a, b) { return a - b; });
}

module.exports = function assertParamsDepth(params) {
  if (!utils.isObject(params)) return;
  var pending = [{ value: params, depth: 0, complete: false }];
  var ancestors = [];
  var visited = null;
  if (typeof WeakMap === 'function') {
    visited = new WeakMap();
  } else if (typeof Map === 'function') {
    visited = new Map();
  }
  // Older runtimes can only compare immutable object identities by scanning.
  // Keep that scan bounded; recently completed subgraphs avoid repeated work,
  // while evicted shared subgraphs may be visited again.
  var cacheSize = 128;
  var visitedValues = [];
  var visitedDepths = [];
  var nextCacheIndex = 0;
  while (pending.length) {
    var entry = pending.pop();
    var value = entry.value;
    var index;
    if (entry.complete) {
      ancestors.pop();
      if (visited) {
        visited.set(value, entry.depth);
      } else {
        index = visitedValues.indexOf(value);
        if (index === -1) {
          index = nextCacheIndex;
          nextCacheIndex = (nextCacheIndex + 1) % cacheSize;
        }
        visitedValues[index] = value;
        visitedDepths[index] = entry.depth;
      }
      continue;
    }
    // The serializer enumerates any object at its root, then recursively
    // visits only plain objects and arrays below that root.
    if (entry.depth === 0 ? !utils.isObject(value) :
      !utils.isPlainObject(value) && !utils.isArray(value)) {
      continue;
    }
    if (entry.depth > 100) {
      throw new AxiosError('params exceed the maximum depth of 100', AxiosError.ERR_BAD_OPTION_VALUE);
    }
    // The depth cap bounds this ancestry scan independently of params width.
    if (ancestors.indexOf(value) !== -1) {
      throw new AxiosError('Circular reference detected in params', AxiosError.ERR_BAD_OPTION_VALUE);
    }
    if (visited) {
      if (visited.has(value) && visited.get(value) >= entry.depth) continue;
    } else {
      index = visitedValues.indexOf(value);
      if (index !== -1 && visitedDepths[index] >= entry.depth) continue;
    }
    ancestors.push(value);
    pending.push({ value: value, depth: entry.depth, complete: true });
    var keys = utils.isArray(value) ? arrayIndexes(value) : Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        pending.push({ value: value[key], depth: entry.depth + 1, complete: false });
      }
    }
  }
};
