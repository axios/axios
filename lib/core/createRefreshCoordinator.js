'use strict';

import AxiosError from './AxiosError.js';
import AxiosHeaders from './AxiosHeaders.js';
import CanceledError from '../cancel/CanceledError.js';

const DEFAULT_RETRY_FLAG = '__isRetryRequest';
const DEFAULT_SKIP_FLAG = '__skipAuthRefresh';
const RESERVED_KEYS = new Set(['constructor', 'prototype', '__proto__']);

function getClockMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function validateFlagName(name, optionName) {
  if (typeof name !== 'string' || !name || RESERVED_KEYS.has(name)) {
    throw new AxiosError(
      `${optionName} must be a non-empty, non-reserved property name`,
      AxiosError.ERR_BAD_OPTION_VALUE
    );
  }
}

function defaultShouldRefresh(error) {
  return Boolean(error && error.response && error.response.status === 401);
}

function tryGetOrigin(url) {
  if (typeof url !== 'string' || !url) {
    return null;
  }
  try {
    return new URL(url).origin;
  } catch (_err) {
    return null;
  }
}

function isAbsoluteRequestUrl(url) {
  return typeof url === 'string' && (/^[a-z][a-z\d+\-.]*:/i.test(url) || url.startsWith('//'));
}

function isTrustedDestination(config, axiosInstance, allowCrossOriginAuth) {
  if (allowCrossOriginAuth) {
    return true;
  }

  const requestUrl = config && config.url;
  if (!requestUrl || !isAbsoluteRequestUrl(requestUrl)) {
    return true;
  }

  const baseUrl =
    (config && config.baseURL) ||
    (axiosInstance && axiosInstance.defaults && axiosInstance.defaults.baseURL) ||
    (typeof location !== 'undefined' && location.origin) ||
    null;

  const baseOrigin = tryGetOrigin(baseUrl);
  if (!baseOrigin) {
    return false;
  }

  try {
    return new URL(requestUrl, baseOrigin).origin === baseOrigin;
  } catch (_err) {
    return false;
  }
}

function applyDefaultAuthHeader(token, config, axiosInstance, allowCrossOriginAuth) {
  if (typeof token !== 'string' || !token) {
    return;
  }
  if (!isTrustedDestination(config, axiosInstance, allowCrossOriginAuth)) {
    return;
  }
  const headers = new AxiosHeaders(config.headers);
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

function awaitWithCancellation(promise, config) {
  const signal = config && config.signal;
  const cancelToken = config && config.cancelToken;

  if (signal && signal.aborted) {
    return Promise.reject(new CanceledError(undefined, config));
  }
  if (cancelToken && cancelToken.reason) {
    return Promise.reject(cancelToken.reason);
  }
  if (!signal && !cancelToken) {
    return promise;
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let onAbort;
    let unsubscribe;

    function cleanup() {
      if (signal && onAbort && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    }

    if (signal && typeof signal.addEventListener === 'function') {
      onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new CanceledError(undefined, config));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    if (cancelToken && typeof cancelToken.subscribe === 'function') {
      const onCancel = (cancel) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(cancel);
      };
      cancelToken.subscribe(onCancel);
      unsubscribe = () => {
        if (typeof cancelToken.unsubscribe === 'function') {
          cancelToken.unsubscribe(onCancel);
        }
      };
    }

    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      }
    );
  });
}

/**
 * Creates a single-flight token refresh coordinator so proactive refresh timers
 * and reactive 401 response interceptors share one lock and never race on
 * rotating refresh tokens.
 *
 * @param {Function} refreshFn Async function returning the refreshed token/payload.
 * @param {Object} [options]
 * @param {number} [options.cooldownMs=0] Minimum ms after a successful refresh during which cached token is reused.
 * @param {Function} [options.shouldRefresh] Predicate receiving the response error to decide whether to refresh.
 * @param {Function} [options.onRefreshed] Hook `(token, config) => void` to apply the refreshed token before retrying.
 * @param {string} [options.retryFlag='__isRetryRequest'] Config flag used to avoid infinite retry loops.
 * @param {string} [options.skipFlag='__skipAuthRefresh'] Config flag to bypass the refresh interceptor (e.g. for refresh calls).
 * @param {boolean} [options.allowCrossOriginAuth=false] Allow default auth header injection on cross-origin absolute URLs.
 */
export default function createRefreshCoordinator(refreshFn, options = {}) {
  if (typeof refreshFn !== 'function') {
    throw new AxiosError('refreshFn must be a function', AxiosError.ERR_BAD_OPTION_VALUE);
  }

  const {
    cooldownMs = 0,
    shouldRefresh: defaultPredicate = defaultShouldRefresh,
    onRefreshed: defaultOnRefreshed,
    retryFlag: defaultRetryFlag = DEFAULT_RETRY_FLAG,
    skipFlag: defaultSkipFlag = DEFAULT_SKIP_FLAG,
    allowCrossOriginAuth: defaultAllowCrossOriginAuth = false,
  } = options || {};

  if (typeof cooldownMs !== 'number' || Number.isNaN(cooldownMs) || cooldownMs < 0) {
    throw new AxiosError('cooldownMs must be a non-negative number', AxiosError.ERR_BAD_OPTION_VALUE);
  }

  validateFlagName(defaultRetryFlag, 'retryFlag');
  validateFlagName(defaultSkipFlag, 'skipFlag');

  let activePromise = null;
  let hasCachedToken = false;
  let lastToken;
  let lastRefreshedAt = 0;
  let generation = 0;
  const retriedConfigs = new WeakSet();

  function refresh(...args) {
    if (activePromise) {
      return activePromise;
    }

    if (cooldownMs > 0 && hasCachedToken && getClockMs() - lastRefreshedAt < cooldownMs) {
      return Promise.resolve(lastToken);
    }

    const callGeneration = generation;

    let execution;
    try {
      execution = Promise.resolve(refreshFn(...args));
    } catch (err) {
      execution = Promise.reject(err);
    }

    activePromise = execution
      .then((token) => {
        if (callGeneration === generation) {
          lastToken = token;
          hasCachedToken = true;
          lastRefreshedAt = getClockMs();
        }
        return token;
      })
      .finally(() => {
        activePromise = null;
      });

    return activePromise;
  }

  function isRefreshing() {
    return activePromise !== null;
  }

  function reset() {
    generation += 1;
    hasCachedToken = false;
    lastToken = undefined;
    lastRefreshedAt = 0;
  }

  function attachInterceptor(axiosInstance, interceptorOptions = {}) {
    if (!axiosInstance || !axiosInstance.interceptors || !axiosInstance.interceptors.response) {
      throw new AxiosError(
        'axiosInstance must be a valid Axios instance',
        AxiosError.ERR_BAD_OPTION_VALUE
      );
    }

    const {
      shouldRefresh = defaultPredicate,
      onRefreshed = defaultOnRefreshed,
      retryFlag = defaultRetryFlag,
      skipFlag = defaultSkipFlag,
      allowCrossOriginAuth = defaultAllowCrossOriginAuth,
    } = interceptorOptions || {};

    validateFlagName(retryFlag, 'retryFlag');
    validateFlagName(skipFlag, 'skipFlag');

    return axiosInstance.interceptors.response.use(undefined, async (error) => {
      const config = error && error.config;
      if (
        !config ||
        config[skipFlag] ||
        config[retryFlag] ||
        retriedConfigs.has(config) ||
        !shouldRefresh(error)
      ) {
        return Promise.reject(error);
      }

      if (config.signal && config.signal.aborted) {
        return Promise.reject(new CanceledError(undefined, config));
      }
      if (config.cancelToken && config.cancelToken.reason) {
        return Promise.reject(config.cancelToken.reason);
      }

      const refreshPromise = refresh(error);
      // Prevent unhandledRejection if all waiting callers cancel before refreshPromise settles.
      refreshPromise.catch(() => {});

      const token = await awaitWithCancellation(refreshPromise, config);

      const retryConfig = {
        ...config,
        headers: new AxiosHeaders(config.headers),
      };

      if (typeof onRefreshed === 'function') {
        await onRefreshed(token, retryConfig);
      } else {
        applyDefaultAuthHeader(token, retryConfig, axiosInstance, allowCrossOriginAuth);
      }

      retryConfig[retryFlag] = true;
      retriedConfigs.add(retryConfig);

      return axiosInstance(retryConfig);
    });
  }

  return {
    refresh,
    isRefreshing,
    reset,
    attachInterceptor,
  };
}
