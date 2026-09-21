'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');

module.exports = function assertParamsDepth(params) {
  var pending = [{ value: params, depth: 0 }];
  var visited = new WeakMap();
  while (pending.length) {
    var entry = pending.pop();
    var value = entry.value;
    if (!utils.isPlainObject(value) && !utils.isArray(value)) {
      continue;
    }
    if (entry.depth > 100) {
      throw new AxiosError('params exceed the maximum depth of 100', AxiosError.ERR_BAD_OPTION_VALUE);
    }
    if (visited.has(value) && visited.get(value) >= entry.depth) continue;
    visited.set(value, entry.depth);
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        pending.push({ value: value[key], depth: entry.depth + 1 });
      }
    }
  }
};
