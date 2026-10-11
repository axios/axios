'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from '../adapters/adapters.js';
import utils from '../utils.js';

const dispatchedRequests = new WeakMap();

// Marks an error object that more than one dispatch rejected with, so its
// request metadata cannot be attributed to any single request.
const CONFLICTING_DISPATCH = Object.freeze({ conflict: true });

const DISPATCH_KEYS = ['method', 'baseURL', 'url', 'data', 'signal', 'cancelToken'];

export const getDispatchedRequest = (reason) =>
  reason && (typeof reason === 'object' || typeof reason === 'function')
    ? dispatchedRequests.get(reason)
    : undefined;

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

  // Transform request data
  config.data = transformData.call(config, config.transformRequest);

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

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

      if (reason && (typeof reason === 'object' || typeof reason === 'function')) {
        const dispatched = {};
        for (const key of DISPATCH_KEYS) {
          dispatched[key] = config[key];
        }
        // Headers carry credentials and tenant context; compare their values,
        // since every dispatch builds a new AxiosHeaders instance.
        const headersKey = JSON.stringify(Object.entries(config.headers.toJSON(true)).sort());
        const previous = dispatchedRequests.get(reason);
        const conflicting =
          previous === CONFLICTING_DISPATCH ||
          (previous &&
            (previous.headersKey !== headersKey ||
              DISPATCH_KEYS.some((key) => previous[key] !== dispatched[key])));
        dispatched.headersKey = headersKey;

        dispatchedRequests.set(reason, conflicting ? CONFLICTING_DISPATCH : dispatched);
      }

      return Promise.reject(reason);
    }
  );
}
