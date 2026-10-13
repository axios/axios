'use strict';

import CanceledError from '../cancel/CanceledError.js';
import AxiosError from './AxiosError.js';
import utils from '../utils.js';
import validator from '../helpers/validator.js';
import { $responseChainEnd } from './Axios.js';
import {
  enableReplayTracking,
  getDispatchedRequest,
  snapshotReplayConfig,
  takeDispatchedRequest,
} from './dispatchRequest.js';

const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const DEFAULT_RETRY_METHODS = ['get', 'head', 'options', 'put', 'delete', 'query'];
const DEFAULT_NETWORK_ERROR_CODES = [
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
];

const RETRY_STATE = Symbol('axios.retry.state');
const retryInterceptors = new WeakMap();

const { validators } = validator;

const arrayValidator = (value) => utils.isArray(value) || 'an array';

const retryOptionValidators = {
  retries: validators.number,
  retryDelay: (value) =>
    typeof value === 'number' || typeof value === 'function' || 'a number or function',
  backoffFactor: validators.number,
  maxDelay: validators.number,
  jitter: validators.boolean,
  respectRetryAfter: validators.boolean,
  statusCodes: arrayValidator,
  retryMethods: arrayValidator,
  networkErrorCodes: arrayValidator,
  shouldRetry: validators.function,
  onRetry: validators.function,
};

function assertRetryOptions(options) {
  validator.assertOptions(options, retryOptionValidators, false);
}

const toNonNegative = (value, defaultValue) =>
  Number.isFinite(value) && value >= 0 ? value : defaultValue;

/**
 * Parse Retry-After header if present on response
 *
 * @param {Object} response
 * @returns {number|null} delay in milliseconds or null
 */
function parseRetryAfter(response) {
  if (!response || !response.headers) return null;
  const headers = response.headers;
  const retryAfter = typeof headers.get === 'function'
    ? headers.get('retry-after')
    : headers['retry-after'] || headers['Retry-After'];

  if (!retryAfter) return null;

  // If number in seconds
  if (/^\d+$/.test(String(retryAfter).trim())) {
    return parseInt(String(retryAfter).trim(), 10) * 1000;
  }

  // If HTTP-date
  const dateMs = Date.parse(retryAfter);
  if (!isNaN(dateMs)) {
    const delay = dateMs - Date.now();
    return delay > 0 ? delay : 0;
  }

  return null;
}

/**
 * Compute exponential backoff delay with jitter
 *
 * @param {number} retryCount
 * @param {Object} [options]
 * @param {Object} [response]
 * @returns {number} Delay in milliseconds
 */
function calculateRetryDelay(retryCount, options = {}, response = null) {
  const maxDelay = toNonNegative(options.maxDelay, 30000);

  if (options.respectRetryAfter !== false && response) {
    const retryAfter = parseRetryAfter(response);
    if (retryAfter !== null) {
      return Math.min(retryAfter, maxDelay);
    }
  }

  if (typeof options.retryDelay === 'function') {
    const requestedDelay = options.retryDelay(retryCount, response);

    return Math.min(Math.max(0, Number.isFinite(requestedDelay) ? requestedDelay : maxDelay), maxDelay);
  }

  const baseDelay = toNonNegative(options.retryDelay, 1000);
  const backoffFactor = toNonNegative(options.backoffFactor, 2);

  let delay = baseDelay * Math.pow(backoffFactor, retryCount);

  if (options.jitter !== false) {
    delay = (delay / 2) + (Math.random() * (delay / 2));
  }

  return Math.min(Math.round(delay), maxDelay);
}

function isReplayableBody(data) {
  return !utils.isStream(data) && !utils.isReadableStream(data);
}

// The caller never receives a response that is retried, so release its unread
// body stream; otherwise it keeps holding the connection the retry may need.
function releaseResponseBody(response) {
  const data = response && response.data;

  if (utils.isStream(data)) {
    utils.isFunction(data.destroy) && data.destroy();
  } else if (utils.isReadableStream(data) && !data.locked) {
    data.cancel().catch(utils.noop);
  }
}

function getCancellationSources(config) {
  const pick = (key) => (utils.hasOwnProp(config, key) && config[key]) || undefined;

  return { cancelToken: pick('cancelToken'), signal: pick('signal') };
}

function createAbortableDelay(delay, config, { cancelToken, signal }) {
  return new Promise((resolve, reject) => {
    let timer;
    let onSignalAbort;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (cancelToken) {
        cancelToken.unsubscribe(onCanceled);
      }

      if (signal && onSignalAbort) {
        signal.removeEventListener('abort', onSignalAbort);
      }
    };

    function onCanceled(reason) {
      cleanup();

      if (reason instanceof AxiosError) {
        reject(reason);
        return;
      }

      const abortReason = this && this.reason;

      reject(new CanceledError(abortReason instanceof Error ? abortReason.message : abortReason, config));
    }

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, delay);

    if (cancelToken) {
      if (cancelToken.reason) {
        onCanceled(cancelToken.reason);
        return;
      }

      cancelToken.subscribe(onCanceled);
    }

    if (signal) {
      if (signal.aborted) {
        onCanceled.call(signal, signal.reason);
        return;
      }

      onSignalAbort = () => onCanceled.call(signal, signal.reason);
      signal.addEventListener('abort', onSignalAbort, { once: true });
    }
  });
}

/**
 * Determine if an error is retryable
 *
 * @param {Error|Object} error
 * @param {Object} [options]
 * @returns {boolean}
 */
function isRetryableError(error, options = {}) {
  return isRetryable(error, options, getDispatchedRequest(error));
}

function isRetryable(error, options, dispatched) {
  if (!error) return false;

  if (error.__CANCEL__ || error.code === 'ERR_CANCELED') {
    return false;
  }

  const retryMethods = (options.retryMethods || DEFAULT_RETRY_METHODS).map((m) => m.toLowerCase());
  const config = error.config;

  const hasMethod = config && utils.hasOwnProp(config, 'method');
  if (dispatched && dispatched.conflict) {
    return false;
  }
  if (config && !hasMethod && !dispatched) {
    return false;
  }

  const method = ((dispatched && dispatched.method) ||
    (hasMethod && config.method) || 'get').toLowerCase();

  if (retryMethods.indexOf(method) === -1) {
    return false;
  }

  if (!error.response) {
    return Boolean(error.code && (options.networkErrorCodes || DEFAULT_NETWORK_ERROR_CODES).includes(error.code));
  }

  const statusCodes = options.statusCodes || DEFAULT_RETRY_STATUS_CODES;
  return statusCodes.includes(error.response.status);
}

/**
 * Attach retry interceptor to an Axios instance
 *
 * @param {Function|Object} axiosInstance
 * @param {Object} [defaultOptions]
 * @returns {number} Interceptor ID
 */
function attachRetry(axiosInstance, defaultOptions = {}) {
  assertRetryOptions(defaultOptions);
  enableReplayTracking(axiosInstance.interceptors.response);

  const previousInterceptor = retryInterceptors.get(axiosInstance);
  if (previousInterceptor !== undefined) {
    axiosInstance.interceptors.response.eject(previousInterceptor);
  }

  const onRetryRejected = async (error) => {
    // Once dispatched, replay the config the adapter received: a custom
    // adapter's error config may be partial, copied, or another request's.
    const dispatched = takeDispatchedRequest(error);

    // The same error object rejected several requests; its metadata cannot
    // identify which request to replay.
    if (dispatched && dispatched.conflict) {
      return Promise.reject(error);
    }

    const config = dispatched || (error && error.config);

    if (!config) {
      return Promise.reject(error);
    }

    const hasRetryOption = utils.hasOwnProp(config, 'retry');

    if (hasRetryOption && config.retry === false) {
      return Promise.reject(error);
    }

    const hasRetryObject = hasRetryOption && utils.isObject(config.retry);

    if (hasRetryObject) {
      assertRetryOptions(config.retry);
    }

    const retryConfig = hasRetryObject
      ? { ...defaultOptions, ...config.retry }
      : { ...defaultOptions };

    const maxRetries = Number.isSafeInteger(retryConfig.retries) && retryConfig.retries >= 0
      ? retryConfig.retries
      : 3;

    const retryState = config[RETRY_STATE] || { count: 0 };

    if (retryState.count >= maxRetries) {
      return Promise.reject(error);
    }

    const replayData = utils.hasOwnProp(config, 'data') ? config.data : undefined;

    if (!isReplayableBody(replayData)) {
      return Promise.reject(error);
    }

    const shouldRetry = typeof retryConfig.shouldRetry === 'function'
      ? retryConfig.shouldRetry(error, retryState.count)
      : isRetryable(error, retryConfig, dispatched);

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    const delay = calculateRetryDelay(retryState.count, retryConfig, error.response);

    if (typeof retryConfig.onRetry === 'function') {
      // Once dispatched, `config` is the snapshot the retry replays, so the
      // callback gets its own copy and cannot change the retried request.
      const callbackConfig = dispatched ? snapshotReplayConfig(config) : config;
      retryConfig.onRetry(retryState.count + 1, error, callbackConfig, delay);
    }

    const nextConfig = { ...config };
    nextConfig[RETRY_STATE] = { count: retryState.count + 1 };
    const cancellation = getCancellationSources(config);
    for (const key of ['cancelToken', 'signal']) {
      if (cancellation[key]) {
        nextConfig[key] = cancellation[key];
      } else {
        delete nextConfig[key];
      }
    }
    if (dispatched) {
      // The adapter received transformed data. Replay those exact bytes rather
      // than running a custom transformRequest a second time.
      nextConfig.transformRequest = [(data) => data];
    }

    // Interceptors registered after this one run once, on the final result,
    // in this chain rather than also inside the retried request's chain.
    nextConfig[$responseChainEnd] = onRetryRejected;

    releaseResponseBody(error.response);

    if (delay > 0) {
      await createAbortableDelay(delay, config, cancellation);
    }

    return axiosInstance(nextConfig);
  };

  const interceptor = axiosInstance.interceptors.response.use(
    (response) => response,
    onRetryRejected
  );
  retryInterceptors.set(axiosInstance, interceptor);

  return interceptor;
}

export {
  attachRetry,
  calculateRetryDelay,
  isRetryableError,
  parseRetryAfter,
  DEFAULT_RETRY_STATUS_CODES,
  DEFAULT_RETRY_METHODS,
  DEFAULT_NETWORK_ERROR_CODES,
};

export default {
  attachRetry,
  calculateRetryDelay,
  isRetryableError,
  parseRetryAfter,
  DEFAULT_RETRY_STATUS_CODES,
  DEFAULT_RETRY_METHODS,
  DEFAULT_NETWORK_ERROR_CODES,
};
