'use strict';

/**
 * Parse a Retry-After header value into milliseconds.
 *
 * Supports two formats defined in RFC 7231:
 *   1. Delta-seconds  — "Retry-After: 120"
 *   2. HTTP-date      — "Retry-After: Wed, 21 Oct 2026 07:28:00 GMT"
 *
 * @param {Object} headers - Response headers object
 * @returns {number|null} Milliseconds to wait, or null if header is absent/invalid
 */

function parseRetryAfter(headers) {
  if (!headers) return null;

  const value = headers['retry-after'] || headers['Retry-After'];
  if (!value) return null;

  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, parseInt(trimmed, 10) * 1000);
  }

  const retryDate = new Date(trimmed);
  if (!isNaN(retryDate.getTime())) {
    return Math.max(0, retryDate.getTime() - Date.now());
  }

  return null;
}

/**
 * Determine whether a failed request should be retried.
 *
 * @param {Object} config  - Axios request config
 * @param {Error}  error   - The axios error from the failed request
 * @param {number} attempt - Zero-based count of retries already made
 * @returns {boolean}
 */

function shouldRetry(config, error, attempt) {
  const retry = config && config.retry;

  if (!retry || typeof retry !== 'object') return false;

  const maxRetries = typeof retry.retries === 'number' ? retry.retries : 0;

  if (attempt >= maxRetries) return false;

  if (!error || !error.response) return false;

  const status = error.response.status;
  const allowedCodes = Array.isArray(retry.retryStatusCodes)
    ? retry.retryStatusCodes
    : [429, 503];

  return allowedCodes.includes(status);
}

/**
 * Calculate how many milliseconds to wait before the next retry.
 * Prefers the Retry-After response header; falls back to config.retryDelay.
 *
 * @param {Object} config          - Axios request config
 * @param {Object} responseHeaders - Headers from the failed response
 * @returns {number} Milliseconds to wait (>= 0)
 */

function getRetryDelay(config, responseHeaders) {
  const retry = config.retry || {};

  if (retry.respectRetryAfter !== false) {
    const headerDelay = parseRetryAfter(responseHeaders);
    if (headerDelay !== null) return headerDelay;
  }

  return typeof retry.retryDelay === 'number' ? retry.retryDelay : 1000;
}

module.exports = {
  parseRetryAfter,
  shouldRetry,
  getRetryDelay
};