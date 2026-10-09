'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 *
 * @returns {string} The combined URL
 */
export default function combineURLs(baseURL, relativeURL) {
  if (!relativeURL) {
    return baseURL || '';
  }

  // Guard against non-string or empty baseURL so callers get a stable result
  // instead of a TypeError when reading .length on undefined/null.
  if (!baseURL || typeof baseURL !== 'string') {
    return relativeURL.replace(/^\/+/, '') || relativeURL;
  }

  let end = baseURL.length;

  while (end > 0 && baseURL.charCodeAt(end - 1) === 47) {
    end--;
  }

  return baseURL.slice(0, end) + '/' + relativeURL.replace(/^\/+/, '');
}
