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

/**
 * Build a URL by appending resources in url segments and params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [resources] The resources to be inserted
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, resources, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  var urlSegments = url.split('/');
  var newUrlSegments = urlSegments.map(function findResource(value) {
    if (value.charAt(0) === ':') {
      var resourceName = value.substring(1, value.length);
      if (resources[resourceName]) {
        return resources[resourceName];
      }

      throw new Error('Resource ' + resourceName + ' is specified but not given.');
    } else {
      return value;
    }
  });

  url = newUrlSegments.join('/');

  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      }

      if (!utils.isArray(val)) {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
