'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');

module.exports = function assertParamsDepth(params) {
  if (!utils.isObject(params)) return;
  var pending = [{ value: params, depth: 0 }];
  var visited = typeof WeakMap === 'function' ? new WeakMap() : null;
  var visitedValues = [];
  var visitedDepths = [];
  while (pending.length) {
    var entry = pending.pop();
    var value = entry.value;
    // The serializer enumerates any object at its root, then recursively
    // visits only plain objects and arrays below that root.
    if (entry.depth === 0 ? !utils.isObject(value) :
      !utils.isPlainObject(value) && !utils.isArray(value)) {
      continue;
    }
    if (entry.depth > 100) {
      throw new AxiosError('params exceed the maximum depth of 100', AxiosError.ERR_BAD_OPTION_VALUE);
    }
    if (visited) {
      if (visited.has(value) && visited.get(value) >= entry.depth) continue;
      visited.set(value, entry.depth);
    } else {
      var index = visitedValues.indexOf(value);
      if (index !== -1 && visitedDepths[index] >= entry.depth) continue;
      if (index === -1) {
        index = visitedValues.length;
        visitedValues.push(value);
      }
      visitedDepths[index] = entry.depth;
    }
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        pending.push({ value: value[key], depth: entry.depth + 1 });
      }
    }
  }
};
