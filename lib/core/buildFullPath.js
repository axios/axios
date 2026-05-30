'use strict';

import isAbsoluteURL from '../helpers/isAbsoluteURL.js';
import combineURLs from '../helpers/combineURLs.js';
import parseProtocol from '../helpers/parseProtocol.js';
import AxiosError from './AxiosError.js';

const isHttpURL = (url) => {
  if (typeof url !== 'string') {
    return false;
  }

  const protocol = parseProtocol(url).toLowerCase();
  return (
    protocol === 'http' ||
    protocol === 'https'
  ) && !url.startsWith(`${protocol}://`);
};

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 *
 * @returns {string} The combined full path
 */
export default function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  if (isHttpURL(requestedURL)) {
    const protocol = parseProtocol(requestedURL).toLowerCase();
    throw new AxiosError(
      `Invalid URL "${requestedURL}", did you mean "${protocol}://${
        requestedURL.slice(requestedURL.indexOf(':') + 1)
      }"?`,
      AxiosError.ERR_INVALID_URL
    );
  }

  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
