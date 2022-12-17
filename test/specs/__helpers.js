import _axios from '../../index.js';
import { fetch as fetchPolyfill } from 'whatwg-fetch';

window.axios = _axios;

// Jasmine config
jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;
jasmine.getEnv().defaultTimeoutInterval = 300000;

let fetchStubbed = false;
let fetchQueue = [];

const defaultMockResponseHeaders = {
  'Content-Type': 'test/mock',
};

const defaultMockResponseInfo = {
  status: 200,
  statusText: 'OK',
  headers: new Headers(defaultMockResponseHeaders),
  body: null,
};

const defaultFetchOptions = {
  mock: defaultMockResponseInfo
};

function mergeStubbedConfig(config_or_mock, config) {
  return Object.assign({
    adapter: 'fetch'
  }, defaultFetchOptions, config || config_or_mock, fetchStubbed ? {
    fetcher: mockFetch,
    fetchOptions: {
      mock: config ? config_or_mock : defaultMockResponseInfo,
    }
  } : {});
}

window.fetchConfigurator = mergeStubbedConfig;

function createResponse(config, statusCode, statusMessage, headers, body) {
  return new Response(body || null, Object.assign({}, defaultMockResponseInfo,{
    status: statusCode || 200,
    statusText: statusMessage || 'OK',
    headers: headers || new Headers(defaultMockResponseHeaders),
  }));
}

function mockFetch(input, opts) {
  const options = opts || defaultFetchOptions;
  if (!options.mock) {
    return fetchPolyfill(input, options);
  }
  fetchQueue.push({
    input,
    options: options || {},
  })
  return new Promise(function (resolve, reject) {
    if (options.mock && options.mock.error) {
      reject(options.mock.error);
    } else {
      resolve(createResponse(
          options,
        options.mock ? options.mock.statusCode : 200,
        options.mock ? options.mock.statusMessage : 'OK',
        options.mock ? options.mock.headers : defaultMockResponseHeaders,
        options.mock ? options.mock.body : null,
      ));
    }
  });
}

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

// Proxy to `getAjaxRequest` (the mock forces a polyfill from `fetch` to `xhr`).
window.getFetchAtIndex = (function (index) {
  if (fetchQueue.length < 1) {
    throw new Error('No recent fetch to retrieve');
  }
  if (typeof index === 'number') {
    if (!fetchQueue[index]) {
      throw new Error('No fetch at index ' + index);
    }
    return fetchQueue[index];
  }
  return fetchQueue.shift();
});

// Proxy to `getAjaxRequest` (the mock forces a polyfill from `fetch` to `xhr`).
window.getFetchAsync = (function () {
  return new Promise(function (resolve, reject) {
    try {
      resolve(getFetchAtIndex(0));
    } catch (err) {
      reject(err);
    }
  });
});

window.getFetch = (function () {
  return getFetchAtIndex(0);
});

// polyfill or resolve `fetch`
const originalFetch = window.fetch || fetchPolyfill;

window.setupMockFetch = (function () {
  fetchStubbed = true;
  fetchQueue = [];
  window.fetch = mockFetch;
});

window.teardownMockFetch = (function () {
  fetchStubbed = false;
  fetchQueue = [];
  window.fetch = originalFetch;
});

window.withMockFetch = (function (ctx, cb) {
  return function (done) {
    try {
      setupMockFetch();
      const promise = cb.bind(ctx)(mergeStubbedConfig, done);
      if (promise) {
        promise.then(done, (err) => {
          throw err;
        });
      }
    } finally {
      teardownMockFetch();
    }
  };
});
