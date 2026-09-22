'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');

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
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        pending.push({ value: value[key], depth: entry.depth + 1, complete: false });
      }
    }
  }
};
