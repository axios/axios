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

function encodeParams(params, prefix) {
  var items = [];

  for (var field in params) {
    if (Object.prototype.hasOwnProperty.call(params, field)) {
      var key = prefix ? prefix + '[' + field + ']' : field;
      var type = typeof params[field];

      switch (type) {
      case 'object':
        if (utils.isDate(params[field])) {
          // handle Date appropriately x=2018-05-27T08:17:46.082Z
          items.push(encode(key) + '=' + params[field].toISOString());
        } else {
          // recursively construct the sub-object
          items.push(encodeParams(params[field], key));
        }
        break;
      case 'function':
        break;
      default:
        items.push(encode(key) + '=' + encode(params[field]));
        break;
      }
    }
  }

  return items.join('&');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    serializedParams = typeof params === 'string' ? params : encodeParams(params);
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
