'use strict';

import CanceledError from '../cancel/CanceledError.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const DEFAULT_RETRY_METHODS = ['get', 'head', 'options', 'put', 'delete'];
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
  if (options.respectRetryAfter !== false && response) {
    const retryAfter = parseRetryAfter(response);
    if (retryAfter !== null) {
      const maxDelay = typeof options.maxDelay === 'number' ? options.maxDelay : 30000;
      return Math.min(retryAfter, maxDelay);
    }
  }

  if (typeof options.retryDelay === 'function') {
    return options.retryDelay(retryCount, response);
  }

  const baseDelay = typeof options.retryDelay === 'number' ? options.retryDelay : 1000;
  const backoffFactor = typeof options.backoffFactor === 'number' ? options.backoffFactor : 2;
  const maxDelay = typeof options.maxDelay === 'number' ? options.maxDelay : 30000;

  let delay = baseDelay * Math.pow(backoffFactor, retryCount);

  if (options.jitter !== false) {
    delay = (delay / 2) + (Math.random() * (delay / 2));
  }

  return Math.min(Math.round(delay), maxDelay);
}

function isReplayableBody(data) {
  return !utils.isStream(data) && !utils.isReadableStream(data);
}

function createAbortableDelay(delay, config) {
  return new Promise((resolve, reject) => {
    let timer;
    let onSignalAbort;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal && onSignalAbort) {
        config.signal.removeEventListener('abort', onSignalAbort);
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

    if (config.cancelToken) {
      if (config.cancelToken.reason) {
        onCanceled(config.cancelToken.reason);
        return;
      }

      config.cancelToken.subscribe(onCanceled);
    }

    if (config.signal) {
      if (config.signal.aborted) {
        onCanceled.call(config.signal, config.signal.reason);
        return;
      }

      onSignalAbort = () => onCanceled.call(config.signal, config.signal.reason);
      config.signal.addEventListener('abort', onSignalAbort, { once: true });
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
  if (!error) return false;

  if (error.__CANCEL__ || error.code === 'ERR_CANCELED') {
    return false;
  }

  const retryMethods = (options.retryMethods || DEFAULT_RETRY_METHODS).map((m) => m.toLowerCase());
  const method = (error.config && error.config.method ? error.config.method : 'get').toLowerCase();

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
  return axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error && error.config;

      if (!config || config.retry === false) {
        return Promise.reject(error);
      }

      const retryConfig = utils.isObject(config.retry)
        ? { ...defaultOptions, ...config.retry }
        : { ...defaultOptions };

      const maxRetries = typeof retryConfig.retries === 'number' ? retryConfig.retries : 3;

      const retryState = config[RETRY_STATE] || { count: 0 };

      if (retryState.count >= maxRetries) {
        return Promise.reject(error);
      }

      if (!isReplayableBody(config.data)) {
        return Promise.reject(error);
      }

      const shouldRetry = typeof retryConfig.shouldRetry === 'function'
        ? retryConfig.shouldRetry(error, retryState.count)
        : isRetryableError(error, retryConfig);

      if (!shouldRetry) {
        return Promise.reject(error);
      }

      const delay = calculateRetryDelay(retryState.count, retryConfig, error.response);

      if (typeof retryConfig.onRetry === 'function') {
        retryConfig.onRetry(retryState.count + 1, error, config, delay);
      }

      const nextConfig = { ...config };
      nextConfig[RETRY_STATE] = { count: retryState.count + 1 };

      if (delay > 0) {
        await createAbortableDelay(delay, config);
      }

      return axiosInstance(nextConfig);
    }
  );
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
