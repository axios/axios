'use strict';

import isAbsoluteURL from '../helpers/isAbsoluteURL.js';
import combineURLs from '../helpers/combineURLs.js';

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 *
 * @throws {TypeError} Throws if the URL is invalid
 * 
 * @returns {string} The combined full path
 */
export default function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    requestedURL = combineURLs(baseURL, requestedURL);
  }

  validateURL(requestedURL);
  return requestedURL;
}

/**
 * Validates a URL
 *
 * @param {string} url The URL to validate
 *
 * @throws {TypeError} Throws if the URL is invalid
 */
export function validateURL(url) {
  new URL(url);
}
