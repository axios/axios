'use strict';

import AxiosError from './AxiosError.js';
import isAbsoluteURL from '../helpers/isAbsoluteURL.js';
import combineURLs from '../helpers/combineURLs.js';

const malformedHttpProtocol = /^https?:(?!\/\/)/i;

function assertValidHttpProtocolURL(url) {
  if (typeof url === 'string' && malformedHttpProtocol.test(url)) {
    throw new AxiosError(
      'Invalid URL: missing "//" after protocol',
      AxiosError.ERR_BAD_REQUEST
    );
  }
}

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
  assertValidHttpProtocolURL(baseURL);
  assertValidHttpProtocolURL(requestedURL);

  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
