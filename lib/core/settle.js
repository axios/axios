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
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    const { status, statusText } = response;
    // Strip query parameters to prevent leaking sensitive data in logs/UI
    const url = response.config?.url 
      ? response.config.url.split('?')[0] 
      : 'unknown URL';
    const method = response.config?.method?.toUpperCase() || 'GET';
    
    let suggestion = '';
    if (status >= 400 && status < 500) {
      suggestion = ' Check the request URL and parameters. For 401/403, verify authentication.';
    } else if (status >= 500) {
      suggestion = ' The server encountered an error. Check server logs or try again later.';
    }
    
    reject(
      new AxiosError(
        \`Request failed with status code \${status} (\${statusText}) for \${method} \${url}.\${suggestion} Ensure validateStatus is configured to accept this status code if expected.\`,
        [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][
          Math.floor(response.status / 100) - 4
        ],
        response.config,
        response.request,
        response
      )
    );
  }
}
