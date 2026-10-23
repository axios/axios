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
  let valid = !response.status || !validateStatus;

  if (!valid) {
    // Adapters call settle() from event callbacks, where a throw would escape as an
    // uncaught exception instead of rejecting the request promise.
    if (typeof validateStatus !== 'function') {
      return reject(
        new AxiosError(
          '`config.validateStatus` must be a function',
          AxiosError.ERR_BAD_OPTION_VALUE,
          response.config,
          response.request,
          response
        )
      );
    }

    try {
      valid = validateStatus(response.status);
    } catch (err) {
      return reject(AxiosError.from(err, null, response.config, response.request, response));
    }
  }

  if (valid) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      response.status >= 400 && response.status < 500 ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response
    ));
  }
}
