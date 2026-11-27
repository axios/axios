'use strict';

import AxiosError from './AxiosError.js';
import AxiosHeaders from './AxiosHeaders.js';
import transformData from './transformData.js';
import CanceledError from '../cancel/CanceledError.js';
import utils from '../utils.js';

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

function tryGetOrigin(url, fallbackOrigin) {
  if (typeof url !== 'string' || !url) {
    return null;
  }
  try {
    return (fallbackOrigin ? new URL(url, fallbackOrigin) : new URL(url)).origin;
  } catch (_err) {
    return null;
  }
}

function isAbsoluteRequestUrl(url) {
  return typeof url === 'string' && (/^[a-z][a-z\d+\-.]*:/i.test(url) || url.startsWith('//'));
}

function getOwnProp(obj, key) {
  return obj != null && utils.hasOwnProp(obj, key) ? obj[key] : undefined;
}

function isNonReplayableStream(data) {
  return utils.isStream(data) || utils.isReadableStream(data);
}

function areTransformArraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function isTrustedDestination(config, axiosInstance, allowCrossOriginAuth) {
  if (allowCrossOriginAuth) {
    return true;
  }

  const pageOrigin = typeof location !== 'undefined' && location && location.origin ? location.origin : null;
  const baseUrl =
    getOwnProp(config, 'baseURL') ||
    getOwnProp(axiosInstance && axiosInstance.defaults, 'baseURL') ||
    pageOrigin ||
    null;

  const requestUrl = getOwnProp(config, 'url');
  if (!requestUrl || !isAbsoluteRequestUrl(requestUrl)) {
    if (!baseUrl) {
      return true;
    }
    try {
      const resolvedBase = pageOrigin ? new URL(baseUrl, pageOrigin) : new URL(baseUrl);
      return resolvedBase.protocol === 'https:';
    } catch (_err) {
      return false;
    }
  }

  const baseOrigin = tryGetOrigin(baseUrl, pageOrigin);
  if (!baseOrigin) {
    return false;
  }

  try {
    const resolved = new URL(requestUrl, baseOrigin);
    return resolved.protocol === 'https:' && resolved.origin === baseOrigin;
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
  const signal = getOwnProp(config, 'signal');
  const cancelToken = getOwnProp(config, 'cancelToken');

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
        getOwnProp(config, skipFlag) ||
        getOwnProp(config, retryFlag) ||
        retriedConfigs.has(config) ||
        !shouldRefresh(error)
      ) {
        return Promise.reject(error);
      }

      const signal = getOwnProp(config, 'signal');
      if (signal && signal.aborted) {
        return Promise.reject(new CanceledError(undefined, config));
      }
      const cancelToken = getOwnProp(config, 'cancelToken');
      if (cancelToken && cancelToken.reason) {
        return Promise.reject(cancelToken.reason);
      }

      const originalData = getOwnProp(config, 'data');
      // Without a custom onRefreshed hook that recreates the body, a consumed stream cannot be resent.
      if (typeof onRefreshed !== 'function' && isNonReplayableStream(originalData)) {
        return Promise.reject(error);
      }

      const refreshPromise = refresh(error);
      // Prevent unhandledRejection if all waiting callers cancel before refreshPromise settles.
      refreshPromise.catch(() => {});

      const token = await awaitWithCancellation(refreshPromise, config);

      const hasCustomHook = typeof onRefreshed === 'function';
      const originalTransformRequest = getOwnProp(config, 'transformRequest');
      const transformSnapshot = Array.isArray(originalTransformRequest)
        ? originalTransformRequest.slice()
        : originalTransformRequest;
      const retryConfig = {
        ...config,
        headers: new AxiosHeaders(getOwnProp(config, 'headers')),
        ...(Array.isArray(originalTransformRequest)
          ? { transformRequest: originalTransformRequest.slice() }
          : {}),
      };

      if (hasCustomHook) {
        await onRefreshed(token, retryConfig);
      } else {
        applyDefaultAuthHeader(token, retryConfig, axiosInstance, allowCrossOriginAuth);
      }

      const retryData = getOwnProp(retryConfig, 'data');
      if (retryData === originalData && isNonReplayableStream(retryData)) {
        return Promise.reject(error);
      }

      // Only suppress re-running `transformRequest` when dispatchRequest already ran
      // (indicated by `error.response` or `error.request`), `transformRequest` was not
      // modified, and `data` cannot have been mutated in place by a custom `onRefreshed`
      // hook (either no custom hook was used or `originalData` is a primitive).
      // If a request interceptor later replaces `config.data` on retry, `transformData`
      // runs the original transforms with full header normalization.
      const didDispatchRun = Boolean(error && (error.response || error.request));
      const retryTransformRequest = getOwnProp(retryConfig, 'transformRequest');
      const dataCannotBeMutatedInPlace =
        !hasCustomHook || originalData == null || typeof originalData !== 'object';
      if (
        didDispatchRun &&
        retryData === originalData &&
        dataCannotBeMutatedInPlace &&
        areTransformArraysEqual(retryTransformRequest, transformSnapshot)
      ) {
        retryConfig.transformRequest = [
          function preserveRetriedData(data) {
            if (data === originalData) {
              return data;
            }
            return transformData.call(this, transformSnapshot);
          },
        ];
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
