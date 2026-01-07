'use strict';

import AxiosError from './AxiosError.js';

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 *
 * @returns {object} The response.
 */
export default function settle(resolve, reject, response) {
  const validateStatus = response.config.validateStatus;
  const status = response.status;
  
  // Explicitly check for undefined/null status rather than falsy check
  // Status 0 is a valid edge case (e.g., file: protocol) but typically indicates an error
  // If status is 0, it should be validated by validateStatus if provided
  if (status === undefined || status === null) {
    resolve(response);
  } else if (!validateStatus || validateStatus(status)) {
    resolve(response);
  } else {
    // Determine error code based on status code range
    // 4xx errors are client errors (ERR_BAD_REQUEST)
    // 5xx errors are server errors (ERR_BAD_RESPONSE)
    const statusCode = Math.floor(status / 100);
    const errorCode = statusCode === 4 
      ? AxiosError.ERR_BAD_REQUEST 
      : statusCode === 5 
        ? AxiosError.ERR_BAD_RESPONSE 
        : AxiosError.ERR_BAD_RESPONSE; // Default to ERR_BAD_RESPONSE for other error status codes
    
    reject(new AxiosError(
      'Request failed with status code ' + status,
      errorCode,
      response.config,
      response.request,
      response
    ));
  }
}
