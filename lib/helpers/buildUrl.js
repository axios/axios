'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

function traverse(node, path) {
  var values = [];
  if (utils.isUndefined(path)) {
    path = [];
  }

  if (utils.isDate(node)) {
    values.push({
      path: path,
      val: node.toISOString()
    });
  }
  else if (utils.isArray(node)) {
    utils.forEach(node, function(child) {
      values = values.concat(traverse(child, path.concat([''])));
    });
  }
  else if (utils.isObject(node)) {
    utils.forEach(node, function(child, key) {
      values = values.concat(traverse(child, path.concat([key])));
    });
  }
  else {
    if (node === null || utils.isUndefined(node)) {
      node = '';
    }

    values.push({
      path: path,
      val: node
    });
  }

  return values;
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildUrl(url, params) {
  if (!params) {
    return url;
  }

  var parts = [];

  utils.forEach(params, function (val, key) {
    utils.forEach(traverse(val), function (v) {
      var fullKey = key;
      utils.forEach(v.path, function(partKey) {
        fullKey = fullKey + '[' + partKey + ']';
      });

      parts.push(encode(fullKey) + '=' + encode(v.val));
    });
  });

  if (parts.length > 0) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
  }

  return url;
};
