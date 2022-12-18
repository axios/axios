import _axios from '../../index.js';
import fetchTestSuite from '../fetch/fetch_abstract.js';
import _fetchHelpers from '../fetch/fetch_helpers.js';
import {teardownMockFetch} from "../fetch/default_helpers.mjs";

window.axios = _axios;

// Jasmine config
jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;
jasmine.getEnv().defaultTimeoutInterval = 300000;

// Mock fetch internals.
window.__fetchSuite = fetchTestSuite.setupFetchTest;
window.getFetchAtIndex = _fetchHelpers.getFetchAtIndex;
window.getFetch = _fetchHelpers.getFetch;

window.getFetchAsync = (async function () {
  return await _fetchHelpers.getFetchAsync(fetch, window);
});

window.fetchConfigurator = (function (config_or_mock, config, forceFetch) {
  return _fetchHelpers.fetchConfigurator(fetch, config_or_mock, config, forceFetch);
});

window.setupMockFetch = (function () {
  _fetchHelpers.setupMockFetch(window.fetch, window);
});

window.teardownMockFetch = (function () {
  _fetchHelpers.teardownMockFetch(window.fetch, window);
});

window.withMockFetch = (function (ctxOrCb, cb) {
  const cbk = cb || ctxOrCb;
  const ctx = cb ? ctxOrCb : this;
  return (done) => {
    return _fetchHelpers.withMockFetch(window.fetch, window, ctx, cbk, /* skipResolve= */ true)(done)
        .then(teardownMockFetch);
  }
});

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
