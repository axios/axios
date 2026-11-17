'use strict';

import AxiosError from './AxiosError.js';
import adapters from '../adapters/adapters.js';
import utils from '../utils.js';

/**
 * Reject a `null` or `undefined` url that a built-in adapter would send
 * somewhere the caller did not choose.
 *
 * With params, the nullish url becomes a query-only url such as `?foo=bar`,
 * which a browser resolves against the current page. Without params, XHR
 * requests `./null` or `./undefined` and the Node adapter throws a native
 * `TypeError`.
 *
 * The request still has a destination when `baseURL` is set, or when the Node
 * HTTP adapter is given a `socketPath`. A caller-supplied adapter handles its
 * own destination and is not checked.
 *
 * `dispatchRequest` and `Axios#getUri` both call this, so `getUri` rejects
 * exactly the configs that a request would reject. Request interceptors are
 * not run by `getUri`, so a url that an interceptor would supply is still
 * missing there. Keep this out of `buildURL` and `buildFullPath`: they only
 * format urls and have other callers.
 *
 * @param {Object} config The merged request config
 * @param {Function} resolveAdapter Returns the adapter that handles the
 * request. Called only for a nullish url without `baseURL`, so a usable url
 * never depends on adapter resolution.
 *
 * @returns {void}
 */
export default function assertValidRequestUrl(config, resolveAdapter) {
  const url = utils.getSafeProp(config, 'url');

  if (url !== null && url !== undefined) {
    return;
  }

  if (utils.getSafeProp(config, 'baseURL')) {
    return;
  }

  const adapter = resolveAdapter();

  // Only the Node HTTP adapter reads socketPath; XHR and fetch ignore it.
  const httpAdapter = adapters.adapters.http;

  if (httpAdapter && adapter === httpAdapter && utils.getSafeProp(config, 'socketPath')) {
    return;
  }

  if (!adapters.isBuiltinAdapter(adapter)) {
    return;
  }

  throw new AxiosError(
    `Invalid URL: url cannot be ${url === null ? 'null' : 'undefined'} when baseURL is not set`,
    AxiosError.ERR_INVALID_URL,
    config
  );
}
