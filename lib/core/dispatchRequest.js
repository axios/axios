'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from "../adapters/adapters.js";

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
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
export default function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  config.headers = AxiosHeaders.from(config.headers);

  // Transform request data
  config.data = transformData.call(
    config,
    config.transformRequest
  );

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  const maxRetries = typeof config.retry === 'number' ? config.retry : defaults.retry;
  const retryDelay = typeof config.retryDelay === 'number' ? config.retryDelay : defaults.retryDelay;

  let attempt = 0;

  function shouldRetry(error, response) {
    // Do not retry for cancellations
    if (isCancel(error)) return false;

    // Retry on network errors (no response)
    if (!response) return true;

    // Retry on server errors (5xx)
    const status = response.status;
    if (status >= 500 && status <= 599) return true;

    return false;
  }

  function backoffDelay(attempt) {
    // simple linear backoff: base * attempt
    return retryDelay * attempt;
  }

  function dispatch() {
    attempt++;
    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData.call(
        config,
        config.transformResponse,
        response
      );

      response.headers = AxiosHeaders.from(response.headers);

      return response;
    }, async function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders.from(reason.response.headers);
        }
      }

      const resp = reason && reason.response ? reason.response : undefined;

      if (attempt <= maxRetries && shouldRetry(reason, resp)) {
        const delay = backoffDelay(attempt);
        const result = await new Promise(function (resolve) {
          setTimeout(resolve, delay);
        });
        return dispatch(result);
      }

      return Promise.reject(reason);
    });
  }

  return dispatch();
}