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
  if (!relativeURL) return baseURL;

  const baseURLRegex = new RegExp(/\/+$/);
  const relativeURLRegex = new RegExp(/^\/+/);
  const multipleSlashes = new RegExp(/\/{3,}/);
  return baseURL.replace(multipleSlashes, '').replace(baseURLRegex, '')
    + '/'
    + relativeURL.replace(multipleSlashes, '').replace(relativeURLRegex, '');
}
