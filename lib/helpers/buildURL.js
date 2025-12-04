'use strict';

import utils from '../utils.js';
import AxiosURLSearchParams from '../helpers/AxiosURLSearchParams.js';

/**
 * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
 * URI encoded counterparts
 *
 * @param {string} val The value to be encoded.
 *
 * @returns {string} The encoded value.
 */
function isJSONLike(val) {
  if (!val || typeof val !== 'string') {
    return false;
  }

  const firstChar = val[0];
  const lastChar = val[val.length - 1];

  if (!((firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']'))) {
    return false;
  }

  try {
    const parsed = JSON.parse(val);
    return parsed !== null && typeof parsed === 'object';
  } catch (e) {
    return false;
  }
}

function encode(val) {
  const encoded = encodeURIComponent(val);

  if (isJSONLike(val)) {
    // For JSON-serialized values, keep colon encoded (%3A) to ensure
    // consistent behavior across environments, while preserving the
    // historical treatment of other special characters.
    return encoded.
      replace(/%24/g, '$').
      replace(/%2C/gi, ',').
      replace(/%20/g, '+');
  }

  return encoded.
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param {?(object|Function)} options
 *
 * @returns {string} The formatted url
 */
export default function buildURL(url, params, options) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }
  
  const _encode = options && options.encode || encode;

  if (utils.isFunction(options)) {
    options = {
      serialize: options
    };
  } 

  const serializeFn = options && options.serialize;

  let serializedParams;

  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils.isURLSearchParams(params) ?
      params.toString() :
      new AxiosURLSearchParams(params, options).toString(_encode);
  }

  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");

    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
}
