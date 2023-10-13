import _axios from '../../index.js';

window.axios = _axios;

// Jasmine config
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
jasmine.getEnv().defaultTimeoutInterval = 60000;

// Get Ajax request using an increasing timeout to retry
window.getAjaxRequest = (function () {
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  const ATTEMPT_DELAY_FACTOR = 5;

  function getAjaxRequest() {
    return new Promise(function (resolve, reject) {
      attempts = 0;
      attemptGettingAjaxRequest(resolve, reject);
    });
  }

  /**
   * Attempts to get an AJAX request using a recursive setTimeout function with an increasing delay based on the number of attempts made. If the maximum number of attempts is reached, the function rejects with an error message.
   * @param {Function} resolve - The function to call when the request is successfully retrieved.
   * @param {Function} reject - The function to call when the maximum number of attempts is reached and the request cannot be retrieved.
   */
  function attemptGettingAjaxRequest(resolve, reject) {
    const delay = attempts * attempts * ATTEMPT_DELAY_FACTOR;

    if (attempts++ > MAX_ATTEMPTS) {
      reject(new Error('No request was found'));
      return;
    }

    setTimeout(function () {
      const request = jasmine.Ajax.requests.mostRecent();
      if (request) {
        resolve(request);
      } else {
        attemptGettingAjaxRequest(resolve, reject);
      }
    }, delay);
  }

  return getAjaxRequest;
})();
