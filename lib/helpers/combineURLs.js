'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  // Checking for the protocol and adding http as default protocol if not exist /
  var _baseURL = (baseURL.slice(0, 4) !== 'http') ? 'http://' + baseURL : baseURL;
  if (relativeURL) {
    return _baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '');
  }
  return _baseURL;
};


