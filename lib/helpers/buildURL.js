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
    // undefined is always an error when params are present (fail-fast)
    if (params) {
      throw new AxiosError('Invalid URL: url cannot be undefined when params are provided', AxiosError.ERR_INVALID_URL);
    }
    // undefined enables the "getUri"/query-only path: treat as empty base
    normalizedUrl = '';
  } else if (typeof url === 'string') {
    normalizedUrl = url;
  } else if (typeof url === 'object' && url !== null) {
    // Check if it's a genuine URL object (including cross-realm support)
    let isUrlObject = false;
    let href;

    try {
      // First check if it's actually a URL instance
      isUrlObject = url instanceof URL;
      
      // For cross-realm support, check if it has URL-like behavior
      // A genuine URL object should have these properties and methods
      if (!isUrlObject && 
          typeof url.href === 'string' && 
          typeof url.origin === 'string' && 
          typeof url.protocol === 'string' &&
          typeof url.host === 'string' &&
          typeof url.username === 'string' &&
          typeof url.password === 'string' &&
          typeof url.hostname === 'string' &&
          typeof url.port === 'string' &&
          typeof url.pathname === 'string' &&
          typeof url.search === 'string' &&
          typeof url.hash === 'string' &&
          typeof url.toString === 'function') {
        isUrlObject = true;
      }
      
      // Only extract href if we've confirmed it's a URL-like object
      if (isUrlObject) {
        href = utils.getSafeProp(url, 'href');
      } else {
        href = undefined;
      }
    } catch (e) {
      // Accessing URL properties can throw on malformed objects
      // We'll treat this as not a valid URL object
      href = undefined;
      isUrlObject = false;
    }

    if (isUrlObject && typeof href === 'string') {
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