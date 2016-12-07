'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  var end = relativeURL.replace(/^\/+/, '');
  return end
    ? baseURL.replace(/\/+$/, '') + '/' + end
    : baseURL;
};
