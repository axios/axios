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

function encodeParams(params, options, prefix) {
  if (typeof params === 'string') {
    return params;
  }

  var items = [];
  var brackets = options && options.arrayFormat === 'brackets' && utils.isArray(params) ? true : false;

  for (var field in params) {
    if (Object.prototype.hasOwnProperty.call(params, field)) {
      var index = brackets ? '' : field;
      var key = prefix ? prefix + '[' + index + ']' : index;
      var type = typeof params[field];

      if (params[field] === null) {
        type = 'null';
      }

      switch (type) {
      case 'null':
        if (!(options && options.skipNulls)) {
          items.push(encode(key) + '=');
        }
        break;
      case 'object':
        if (utils.isDate(params[field])) {
          // handle Date appropriately x=2018-05-27T08:17:46.082Z
          items.push(encode(key) + '=' + encode(params[field].toISOString()));
        } else if (options && options.json && (!utils.isArray(params[field]) || utils.isArray(params))) {
          // with json option, just handle first level of arrays
          items.push(encode(key) + '=' + encode(JSON.stringify(params[field])));
        } else {
          // recursively construct the sub-object
          items.push(encodeParams(params[field], options, key));
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
  if (paramsSerializer === 'simple') {
    serializedParams = encodeParams(params, {
      arrayFormat: 'brackets',
      json: true,
      skipNulls: true
    });
  } else if (paramsSerializer === 'brackets') {
    serializedParams = encodeParams(params, { arrayFormat: 'brackets' });
  } else if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    serializedParams = encodeParams(params);
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
