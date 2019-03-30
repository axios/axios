'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  if (relativeURL) {
    // Checking for the protocol, adding http as default protocol if not exist /
    _baseURL = (baseURL.slice(0, 4) !== 'http') ? 'http://' + baseURL : baseURL;
    return _baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '');
  }
  return baseURL;
};


