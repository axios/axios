'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from '../adapters/adapters.js';
import utils from '../utils.js';

// Maps an adapter rejection to a snapshot of the config the adapter received,
// so a retry replays that exact request rather than whatever config the adapter
// attached to its error.
const dispatchedRequests = new WeakMap();

// Dispatch tracking only serves the retry interceptor, so requests made before
// any instance attaches it skip the snapshot entirely.
let replayTrackingEnabled = false;

export const enableReplayTracking = () => {
  replayTrackingEnabled = true;
};

// Returned for an error object that more than one pending dispatch rejected
// with, so its request cannot be attributed to any single dispatch.
const CONFLICTING_DISPATCH = Object.freeze({ conflict: true });

const isTrackable = (reason) =>
  Boolean(reason) && (typeof reason === 'object' || typeof reason === 'function');

const toDispatchedRequest = (record) =>
  record && (record.dispatches > 1 ? CONFLICTING_DISPATCH : record.config);

export const getDispatchedRequest = (reason) =>
  isTrackable(reason) ? toDispatchedRequest(dispatchedRequests.get(reason)) : undefined;

// Claims one dispatch's record. Each dispatch that rejected with the same error
// object is claimed once, so sequential retries that reuse an error object are
// not mistaken for concurrent requests sharing it.
export const takeDispatchedRequest = (reason) => {
  const record = isTrackable(reason) ? dispatchedRequests.get(reason) : undefined;

  if (!record) {
    return undefined;
  }

  const dispatched = toDispatchedRequest(record);

  if (--record.unclaimed <= 0) {
    dispatchedRequests.delete(reason);
  }

  return dispatched;
};

// Nested values a retry replays that carry request shape or credentials. They
// are copied, along with the headers, so an adapter or middleware mutating the
// dispatched config cannot change the request a retry sends.
const REPLAY_NESTED_KEYS = ['params', 'auth', 'proxy'];

// Recursively detaches plain objects and arrays, including those nested in
// arrays, so no part of the snapshot stays shared with the dispatched config.
const cloneReplayValue = (value, seen = new WeakMap()) => {
  if (utils.isURLSearchParams(value)) {
    return new value.constructor(value);
  }

  if (!utils.isArray(value) && !utils.isPlainObject(value)) {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  const copy = utils.isArray(value) ? [] : {};
  seen.set(value, copy);

  for (const key of Object.keys(value)) {
    // defineProperty keeps keys such as `__proto__` as plain data.
    Object.defineProperty(copy, key, {
      value: cloneReplayValue(value[key], seen),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  return copy;
};

const snapshotReplayConfig = (config) => {
  const snapshot = { ...config, headers: config.headers.concat() };

  for (const key of REPLAY_NESTED_KEYS) {
    if (utils.hasOwnProp(config, key)) {
      snapshot[key] = cloneReplayValue(config[key]);
    }
  }

  return snapshot;
};

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

  // Taken before the adapter runs, so the record holds the request as sent.
  const replayConfig = replayTrackingEnabled ? snapshotReplayConfig(config) : undefined;

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

      if (replayConfig && isTrackable(reason)) {
        const previous = dispatchedRequests.get(reason);

        if (previous) {
          previous.dispatches++;
          previous.unclaimed++;
        } else {
          dispatchedRequests.set(reason, { config: replayConfig, dispatches: 1, unclaimed: 1 });
        }
      }

      return Promise.reject(reason);
    }
  );
}
