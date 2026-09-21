'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');

var MAX_FORM_DATA_TO_JSON_DEPTH = 100;

function assertPathDepth(path) {
  var depth = path.length - 1;

  if (depth > MAX_FORM_DATA_TO_JSON_DEPTH) {
    throw new AxiosError(
      'Maximum object depth of ' + MAX_FORM_DATA_TO_JSON_DEPTH + ' exceeded (got ' + depth + ' levels)',
      AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED
    );
  }
}

function parsePropPath(name) {
  // foo[x][y][z]
  // foo.x.y.z
  // foo-x-y-z
  // foo x y z
  return utils.matchAll(/\w+|\[(\w*)]/g, name).map(function(match) {
    return match[0] === '[]' ? '' : match[1] || match[0];
  });
}

function arrayToObject(arr) {
  var obj = {};
  var keys = Object.keys(arr);
  var i;
  var len = keys.length;
  var key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}

function normalizeArray(value) {
  if (!utils.isArray(value)) return value;

  var keys = Object.keys(value);
  if (keys.length !== value.length) return arrayToObject(value);

  for (var i = 0; i < keys.length; i++) {
    var index = +keys[i];
    if (
      index < 0 || index >= value.length ||
      Math.floor(index) !== index || String(index) !== keys[i]
    ) {
      return arrayToObject(value);
    }
  }

  return value;
}

function normalizeArrays(obj) {
  var pending = [obj];
  function normalizeEntry(target, key) {
    var value = target[key] = normalizeArray(target[key]);
    if (utils.isArray(value) || utils.isPlainObject(value)) {
      pending.push(value);
    }
  }
  while (pending.length) {
    var target = pending.pop();
    var keys = Object.keys(target);
    for (var i = 0; i < keys.length; i++) {
      normalizeEntry(target, keys[i]);
    }
  }
  return obj;
}

function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    var name = path[index++];

    if (name === '__proto__') return true;

    var isNumericKey = isFinite(+name);
    var isLast = index >= path.length;
    name = !name && utils.isArray(target) ? target.length : name;

    if (isLast) {
      if (utils.hasOwnProperty(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }

      return !isNumericKey;
    }

    if (!utils.hasOwnProperty(target, name) || !utils.isObject(target[name])) {
      target[name] = [];
    }

    var result = buildPath(path, value, target[name], index);

    if (result && utils.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }

    return !isNumericKey;
  }

  if (utils.isFormData(formData) && utils.isFunction(formData.entries)) {
    var obj = {};

    utils.forEachEntry(formData, function(name, value) {
      var path = parsePropPath(name);

      assertPathDepth(path);
      buildPath(path, value, obj, 0);
    });

    return normalizeArrays(obj);
  }

  return null;
}

module.exports = formDataToJSON;
