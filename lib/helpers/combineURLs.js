'use strict';

const LazyURL = require("lazy-url").LazyURL;

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? new LazyURL(relativeURL, baseURL).toRealString()
    : baseURL;
};
