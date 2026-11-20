'use strict';

import AxiosError from './AxiosError.js';
import AxiosHeaders from './AxiosHeaders.js';

const DEFAULT_RETRY_FLAG = '__isRetryRequest';

function getClockMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function defaultShouldRefresh(error) {
  return Boolean(error && error.response && error.response.status === 401);
}

function applyDefaultAuthHeader(token, config) {
  if (typeof token !== 'string' || !token) {
    return;
  }
  const headers = AxiosHeaders.from(config.headers);
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
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
 */
export default function createRefreshCoordinator(refreshFn, options = {}) {
  if (typeof refreshFn !== 'function') {
    throw new AxiosError('refreshFn must be a function', AxiosError.ERR_BAD_OPTION_VALUE);
  }

  const {
    cooldownMs = 0,
    shouldRefresh: defaultPredicate = defaultShouldRefresh,
    onRefreshed: defaultOnRefreshed = applyDefaultAuthHeader,
    retryFlag: defaultRetryFlag = DEFAULT_RETRY_FLAG,
  } = options || {};

  if (typeof cooldownMs !== 'number' || Number.isNaN(cooldownMs) || cooldownMs < 0) {
    throw new AxiosError('cooldownMs must be a non-negative number', AxiosError.ERR_BAD_OPTION_VALUE);
  }

  let activePromise = null;
  let hasCachedToken = false;
  let lastToken;
  let lastRefreshedAt = 0;

  function refresh(...args) {
    if (activePromise) {
      return activePromise;
    }

    if (cooldownMs > 0 && hasCachedToken && getClockMs() - lastRefreshedAt < cooldownMs) {
      return Promise.resolve(lastToken);
    }

    let execution;
    try {
      execution = Promise.resolve(refreshFn(...args));
    } catch (err) {
      execution = Promise.reject(err);
    }

    activePromise = execution
      .then((token) => {
        lastToken = token;
        hasCachedToken = true;
        lastRefreshedAt = getClockMs();
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
    } = interceptorOptions || {};

    return axiosInstance.interceptors.response.use(undefined, async (error) => {
      const config = error && error.config;
      if (!config || config[retryFlag] || !shouldRefresh(error)) {
        return Promise.reject(error);
      }

      config[retryFlag] = true;

      const token = await refresh(error);
      await onRefreshed(token, config);
      return axiosInstance(config);
    });
  }

  return {
    refresh,
    isRefreshing,
    reset,
    attachInterceptor,
  };
}
