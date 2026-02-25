'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosError from '../core/AxiosError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from '../adapters/adapters.js';

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
 * Validate timeout value before dispatching to adapters.
 * Catches negative, NaN, and Infinity values early with a clear error
 * instead of letting them propagate to Node.js internals where they
 * cause confusing RangeError messages.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function validateTimeout(config) {
  if (config.timeout == null || config.timeout === false) {
    return;
  }

  const timeout = Number(config.timeout);

  if (Number.isNaN(timeout)) {
    // Non-parsable values (objects, non-numeric strings, etc.)
    // are handled by individual adapters for backward compatibility
    return;
  }

  if (timeout < 0) {
    throw new AxiosError(
      'timeout must be a non-negative number, got `' + config.timeout + '`',
      AxiosError.ERR_BAD_OPTION_VALUE,
      config
    );
  }

  if (!Number.isFinite(timeout)) {
    throw new AxiosError(
      'timeout must be a finite number, got `' + config.timeout + '`',
      AxiosError.ERR_BAD_OPTION_VALUE,
      config
    );
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
  validateTimeout(config);

  config.headers = AxiosHeaders.from(config.headers);

  // Transform request data
  config.data = transformData.call(config, config.transformRequest);

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData.call(config, config.transformResponse, response);

      response.headers = AxiosHeaders.from(response.headers);

      return response;
    },
    function onAdapterRejection(reason) {
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

      return Promise.reject(reason);
    }
  );
}
