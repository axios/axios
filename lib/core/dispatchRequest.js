'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import AxiosError from '../core/AxiosError.js';
import adapters from '../adapters/adapters.js';
import utils from '../utils.js';

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config);
  }
}

/**
 * Rejects a request that has no usable destination before a built-in adapter
 * can resolve it against the current document.
 *
 * A dispatched request needs a destination. When the url is `null` or
 * `undefined` and no `baseURL` is configured, the url is silently coerced to
 * an empty string by the url builders, and an empty string is a valid relative
 * url: in a browser it resolves against the current page, so the request is
 * sent to an unintended destination instead of failing. Since 1.18.1 that
 * coercion also applies when params are present, so `axios.get(null, {params})`
 * builds `?foo=bar` and fires a request at the current page.
 *
 * A configured `baseURL` supplies the destination on its own, so a nullish url
 * is valid in that case and keeps resolving to the base url.
 *
 * A caller-supplied adapter is left alone. Such an adapter owns the transport
 * and may legitimately not need a url at all, so the destination requirement
 * does not apply to it.
 *
 * This check lives at the dispatch boundary on purpose. `buildURL` is shared
 * with `axios.getUri()`, which builds a query string without dispatching a
 * request and legitimately supports a query-only result, so the destination
 * requirement cannot be enforced in the helper itself.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function assertValidRequestUrl(config) {
  const url = utils.getSafeProp(config, 'url');

  if (url !== null && url !== undefined) {
    return;
  }

  if (utils.getSafeProp(config, 'baseURL')) {
    return;
  }

  // A custom adapter decides for itself how to reach the destination.
  if (utils.isFunction(utils.getSafeProp(config, 'adapter'))) {
    return;
  }

  throw new AxiosError(
    `Invalid URL: url cannot be ${url === null ? 'null' : 'undefined'} for a dispatched request`,
    AxiosError.ERR_INVALID_URL,
    config
  );
}

/**
 * Resolve the clock used to time adapter execution.
 *
 * Prefers the monotonic `performance.now()` so wall-clock adjustments do not
 * skew the measurement, and so frameworks that forbid reading the current
 * time during prerendering (e.g. Next.js Cache Components) accept it. Falls
 * back to `Date.now()` in runtimes without the High Resolution Time API.
 *
 * @returns {() => number} Millisecond clock
 */
function resolveClock() {
  return typeof performance !== 'undefined' && utils.isFunction(performance.now)
    ? () => performance.now()
    : Date.now;
}

/**
 * Whole milliseconds elapsed since `start`, floored at zero.
 *
 * Rounded so the value stays an integer as with `Date.now()`. The fallback
 * wall clock can move backwards mid-request, so the result is clamped.
 *
 * @param {() => number} now Clock returned by `resolveClock()`
 * @param {number} start Timestamp read from `now`
 *
 * @returns {number} Non-negative elapsed milliseconds
 */
function elapsedSince(now, start) {
  return Math.max(0, Math.round(now() - start));
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
export default function dispatchRequest(_config) {
  // Interceptors may replace the merged config with an ordinary object. Flatten
  // it at the dispatch boundary so shared prototype members cannot become
  // request behavior, while preserving intentional template/class members.
  const config = utils.toSafeFlatObject(_config);

  throwIfCancellationRequested(config);

  assertValidRequestUrl(config);

  config.headers = AxiosHeaders.from(utils.getSafeProp(config, 'headers'));

  // Transform request data
  config.data = transformData.call(config, config.transformRequest);

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  const now = resolveClock();
  const start = now();

  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      response.duration = elapsedSince(now, start);

      // Expose the current response on config so that transformResponse can
      // attach it to any AxiosError it throws (e.g. on JSON parse failure).
      // We clean it up afterwards to avoid polluting the config object.
      config.response = response;
      try {
        response.data = transformData.call(config, config.transformResponse, response);
      } finally {
        delete config.response;
      }

      response.headers = AxiosHeaders.from(response.headers);

      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.duration = elapsedSince(now, start);
          config.response = reason.response;
          try {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
          } finally {
            delete config.response;
          }
          reason.response.headers = AxiosHeaders.from(reason.response.headers);
        }
      }

      return Promise.reject(reason);
    }
  );
}
