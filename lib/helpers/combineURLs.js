'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  if (!relativeURL) {
    return baseURL;
  }

  var base = baseURL.replace(/\/?\/$/, '');

  if (/^\/*$/.test(base)) {
    // A base made only of slashes points at the root of the current origin.
    // Drop leading slashes, backslashes, tabs and newlines from the relative
    // URL as well: URL parsers ignore tabs and newlines and treat '\' as '/',
    // so leaving them would turn the result into a protocol-relative URL.
    return '/' + relativeURL.replace(/^[\/\\\t\n\r]+/, '');
  }

  return base + '/' + relativeURL.replace(/^\/+/, '');
};
