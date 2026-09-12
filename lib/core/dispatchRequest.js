'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
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

  // Keep the caller-supplied data so the exposed response config reflects what
  // was set (e.g. an object assigned in a request interceptor) instead of the
  // serialized transport body. The adapter still receives the transformed value.
  // Read directly to mirror transformData below, which consumes context.data.
  const originalData = config.data;

  // Build the caller-facing config without touching the adapter-owned object.
  // Unsafe keys are skipped and symbol-keyed fields are preserved, mirroring
  // utils.toSafeFlatObject, but always a fresh object so the adapter-owned
  // config can never observe the restoration.
  function restoreRequestData(responseConfig) {
    const exposed = Object.create(null);

    for (const key of Object.getOwnPropertyNames(responseConfig)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      exposed[key] = responseConfig[key];
    }

    if (Object.getOwnPropertySymbols) {
      for (const sym of Object.getOwnPropertySymbols(responseConfig)) {
        exposed[sym] = responseConfig[sym];
      }
    }

    exposed.data = originalData;
    return exposed;
  }

  // Transform request data
  config.data = transformData.call(config, config.transformRequest);

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      if (response.config) {
        response.config = restoreRequestData(response.config);
      }

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
          const rejectedConfig = reason.response.config;

          if (rejectedConfig) {
            reason.response.config = restoreRequestData(rejectedConfig);

            // settle() hands the same object to error.config and
            // error.response.config, so keep them consistent.
            if (reason.config === rejectedConfig) {
              reason.config = reason.response.config;
            }
          }

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
