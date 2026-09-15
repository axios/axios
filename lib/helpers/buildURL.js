'use strict';

import utils from '../utils.js';
import AxiosURLSearchParams from './AxiosURLSearchParams.js';
import AxiosError from '../core/AxiosError.js';

/**
 * It replaces URL-encoded forms of `:`, `$`, `,`, and spaces with
 * their plain counterparts (`:`, `$`, `,`, `+`).
 *
 * @param {string} val The value to be encoded.
 *
 * @returns {string} The encoded value.
 */
export function encode(val) {
  return encodeURIComponent(val)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+');
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
  // 1. Normalize and Validate URL first (Ensures return type is always string)
  let normalizedUrl = url;

  if (url === null || url === undefined) {
    // If params are present, this is an error. If not, it's just an empty base.
    if (params) {
      throw new AxiosError('Invalid URL: url cannot be null or undefined when params are provided', AxiosError.ERR_INVALID_URL);
    }
    normalizedUrl = '';
  } else if (typeof url === 'string') {
    normalizedUrl = url;
  } else if (typeof url === 'object' && 'href' in url && typeof url.href === 'string') {
    normalizedUrl = url.href;
  } else {
    // Reject any other types (numbers, booleans, or objects with non-string href)
    if (params) {
      throw new AxiosError('Invalid URL: url must be a string or URL object when params are provided', AxiosError.ERR_INVALID_URL);
    }
    normalizedUrl = String(url);
  }

  if (!params) {
    return normalizedUrl;
  }

  // Read serializer options pollution-safely: own properties and methods on a
  // class/template prototype are honored, but values injected onto a polluted
  // Object.prototype are ignored.
  const _encode = utils.getSafeProp(_options, 'encode') || encode;
  const serializeFn = utils.getSafeProp(_options, 'serialize');

  let serializedParams;

  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils.isURLSearchParams(params)
      ? params.toString()
      : new AxiosURLSearchParams(params, _options).toString(_encode);
  }

  if (serializedParams) {
    const hashmarkIndex = normalizedUrl.indexOf('#');

    if (hashmarkIndex !== -1) {
      normalizedUrl = normalizedUrl.slice(0, hashmarkIndex);
    }
    normalizedUrl += (normalizedUrl.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return normalizedUrl;
}
