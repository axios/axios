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
  
  baseURL = baseURL.replace(/\/{3,}/, '').replace(/\/+$/, '');
  relativeURL = relativeURL.replace(/\/{3,}/, '').replace(/^\/+/, '');
  return baseURL + '/' + relativeURL
}
