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
  
  return baseURL.replace(/\/{3,}/, '').replace(/\/+$/, '')
    + '/'
    + relativeURL.replace(/\/{3,}/, '').replace(/^\/+/, '');
}
