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
function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param {?object} options
 *
 * @returns {string} The formatted url
 */
export default function buildURL(url, params, options) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  const hashmarkIndex = url.indexOf('#');

  if (hashmarkIndex !== -1) {
    url = url.slice(0, hashmarkIndex);
  }

  const _encode = options && options.encode || encode;

  const serializerParams = utils.isURLSearchParams(params) ?
    params.toString() :
    new AxiosURLSearchParams(params, options).toString(_encode);

  if (serializerParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializerParams;
  }

  return url;
}
