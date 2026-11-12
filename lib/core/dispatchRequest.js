'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosError from '../core/AxiosError.js';
import transitionalDefaults from '../defaults/transitional.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
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
 * Reject a request with a `null` or `undefined` url before a built-in adapter
 * sends it somewhere the caller did not choose.
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
 * `buildURL` is not the place for this check: `axios.getUri()` shares it and
 * must keep returning query-only urls.
 *
 * @param {Object} config The config that is to be used for the request
 * @param {Function} adapter The adapter resolved by `getAdapter`
 *
 * @returns {void}
 */
function assertValidRequestUrl(config, adapter) {
  const url = utils.getSafeProp(config, 'url');

  if (url !== null && url !== undefined) {
    return;
  }

  if (utils.getSafeProp(config, 'baseURL')) {
    return;
  }

  // Only the Node HTTP adapter reads socketPath; XHR and fetch ignore it.
  const httpAdapter = adapters.adapters.http;

  if (httpAdapter && adapter === httpAdapter && utils.getSafeProp(config, 'socketPath')) {
    return;
  }

  if (!adapters.isBuiltinAdapter(adapter)) {
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
 * Await request transformations while observing cancellation and timeout.
 * Cancelling or timing out cannot forcibly stop user-owned async work, but
 * later transformers and the adapter must not run after settlement.
 */
function awaitTransformedData(data, config, transformStatus) {
  const configTimeout = utils.getSafeProp(config, 'timeout');
  const timeout = Number(configTimeout);
  const hasTimeout = Number.isFinite(timeout) && timeout > 0;

  if (!config.signal && !config.cancelToken && !hasTimeout) {
    return Promise.resolve(data);
  }

  let onSignalAbort;
  let onTokenCancel;
  let timeoutId;

  const cancellation = new Promise((_, reject) => {
    const fail = (error) => {
      transformStatus.failure = error;
      reject(error);
    };

    if (config.cancelToken) {
      onTokenCancel = (reason) => fail(reason);
      config.cancelToken.subscribe(onTokenCancel);
    }

    if (config.signal) {
      onSignalAbort = () => fail(new CanceledError(null, config));
      config.signal.addEventListener('abort', onSignalAbort);
      if (config.signal.aborted) {
        onSignalAbort();
      }
    }

    if (hasTimeout) {
      // Timers can run late when a transformer blocks the event loop. Retain
      // a monotonic deadline so a resolved transformer cannot dispatch after it.
      const now = resolveClock();
      const deadline = now() + timeout;
      const createTimeoutError = () => {
        const transitional = utils.getSafeProp(config, 'transitional') || transitionalDefaults;
        return new AxiosError(
          utils.getSafeProp(config, 'timeoutErrorMessage') ||
            'timeout of ' + configTimeout + 'ms exceeded',
          transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config
        );
      };

      transformStatus.checkDeadline = () => {
        if (now() >= deadline) {
          const error = transformStatus.failure || createTimeoutError();
          transformStatus.failure = error;
          throw error;
        }
      };

      // Node and browser timers cannot reliably represent delays greater
      // than the maximum signed 32-bit integer. Wait in bounded intervals
      // while preserving the original monotonic deadline.
      const maxTimerDelay = 0x7fffffff;
      const scheduleTimeout = () => {
        const remaining = deadline - now();
        if (remaining <= 0) {
          fail(createTimeoutError());
          return;
        }
        timeoutId = setTimeout(scheduleTimeout, Math.min(remaining, maxTimerDelay));
      };

      scheduleTimeout();
    }
  });

  return Promise.race([Promise.resolve(data), cancellation]).finally(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (config.cancelToken) {
      config.cancelToken.unsubscribe(onTokenCancel);
    }
    if (config.signal) {
      config.signal.removeEventListener('abort', onSignalAbort);
    }
  });
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

  config.headers = AxiosHeaders.from(utils.getSafeProp(config, 'headers'));

  // Await asynchronous request transforms before invoking the adapter, without
  // deferring the normal synchronous transform path.
  const transformStatus = { failure: null };
  const transformedData = transformData.call(
    config,
    config.transformRequest,
    undefined,
    () => {
      if (transformStatus.failure) {
        throw transformStatus.failure;
      }
      // A previous async transformer may have completed after cancellation.
      throwIfCancellationRequested(config);
      // The timer callback may not have run yet even if the deadline passed.
      if (transformStatus.checkDeadline) {
        transformStatus.checkDeadline();
      }
    }
  );

  const sendRequest = (data) => {
    // Cancellation or an overdue transform deadline must prevent dispatch.
    throwIfCancellationRequested(config);
    if (transformStatus.checkDeadline) {
      transformStatus.checkDeadline();
    }
    config.data = data;

    if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
      config.headers.setContentType('application/x-www-form-urlencoded', false);
    }

    const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

    // Validate the destination after selecting the adapter.
    assertValidRequestUrl(config, adapter);

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
  };

  return transformedData != null && typeof transformedData.then === 'function'
    ? awaitTransformedData(transformedData, config, transformStatus).then(sendRequest)
    : sendRequest(transformedData);
}
