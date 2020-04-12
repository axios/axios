'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function fetchAdapter(config) {
  return new Promise(function dispatchFetchRequest(resolve, reject) {
    var requestData = config.data || null;
    var requestHeaders = config.headers;

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var init = {};

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      init.credentials = 'include';
    }

    // prep abort controller
    var aborter = new AbortController();
    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        aborter.abort();
        reject(cancel);
      });
    }

    // setup timeout listener
    function listenForTimeout() {
      if (!!config.timeout) {
        setTimeout(function popTimeout() {
          aborter.abort();
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED', config));
        }, config.timeout);
      }
    }

    // copy headers in
    var headers = new Headers();
    for (var key in requestHeaders) {
      if (requestHeaders.hasOwnProperty(key)) {
        headers.append(key, requestHeaders[key]);
      }
    }

    // build the target URL
    var fullPath = buildFullPath(config.baseURL, config.url);

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // kick off the fetch
    var request = new Request(buildURL(fullPath, config.params, config.paramsSerializer));
    var operation = fetch(request, Object.assign({}, init, {
      method: config.method.toUpperCase(),
      body: requestData,
      headers: headers
    }));

    listenForTimeout();
    operation.then(function fetchFollowup(response) {
      // protocol-level error
      if (!response.ok) {
        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        // Prepare the response
        var responseHeaders = response.headers;
        var responseData = null;
        if (!!config.responseType) {
          switch (config.responseType) {
          case 'text': responseData = response.text(); break;
          case 'json': responseData = response.json(); break;
          case 'blob': responseData = response.blob(); break;
          default: response.text(); break;
          }
        }

        var axiosResponse = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          config: config,
          request: request
        };

        // we're good to go
        settle(resolve, reject, axiosResponse);
      } else {
        if (response.status >= 500) {
          reject(createError('Server error', config, response.statusText, response));
        } else if (response.status >= 400) {
          reject(createError('Client-side error', config, response.statusText, response));
        } else {
          reject(createError('Unknown error', config, response.statusText, response));
        }
      }
    }, function handleFetchError(err) {
      // outright send/transport error
      reject(createError('Network Error', config, null, err));
    });
  });
};
