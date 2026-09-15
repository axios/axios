'use strict';

import utils from '../utils.js';
import AxiosURLSearchParams from './AxiosURLSearchParams.js';
import AxiosError from '../core/AxiosError.js';

/**
 * It replaces URL-encoded forms of `:`, `$`, `,`, and spaces with
 * their plain counterparts (`:`, `$`, `,`, `+`).
 *
 * @param {string} val The value to be encoded.
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

  if (url === null) {
    // null is always an error when params are present (fail-fast)
    if (params) {
      throw new AxiosError('Invalid URL: url cannot be null when params are provided', AxiosError.ERR_INVALID_URL);
    }
    normalizedUrl = '';
  } else if (url === undefined) {
    // undefined enables the "getUri"/query-only path: treat as empty base
    normalizedUrl = '';
  } else if (typeof url === 'string') {
    normalizedUrl = url;
  } else if (typeof url === 'object' && url !== null) {
    const href = utils.getSafeProp(url, 'href');
    if (typeof href === 'string') {
      normalizedUrl = href;
    } else if (params) {
      throw new AxiosError('Invalid URL: url must be a string or URL object when params are provided', AxiosError.ERR_INVALID_URL);
    } else {
      normalizedUrl = String(url);
    }
  } else if (params) {
    throw new AxiosError('Invalid URL: url must be a string or URL object when params are provided', AxiosError.ERR_INVALID_URL);
  } else {
    normalizedUrl = String(url);
  }

  if (!params) {
    return normalizedUrl;
  }

  // 2. Read serializer options pollution-safely
  const _options = utils.isFunction(options)
    ? {
        serialize: options,
      }
    : options;

  // 3. Encode and serialize the params
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