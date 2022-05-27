'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var buildFullPath = require('./buildFullPath');
var validator = require('../helpers/validator');
var AxiosHeaders = require('./AxiosHeaders');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
 * @param {?Object} config
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  config = mergeConfig(this.defaults, config);

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // Set config.method
  config.method = (config.method || this.defaults.method || 'get').toLowerCase();

  // Flatten headers
  var defaultHeaders = config.headers && utils.merge(
    config.headers.common,
    config.headers[config.method]
  );

  defaultHeaders && utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  config.headers = new AxiosHeaders(config.headers, defaultHeaders);

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;
  var i = 0;
  var len;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest.bind(this), undefined];
    chain.unshift.apply(chain, requestInterceptorChain);
    chain.push.apply(chain, responseInterceptorChain);
    len = chain.length;

    promise = Promise.resolve(config);

    while (i < len) {
      promise = promise.then(chain[i++], chain[i++]);
    }

    return promise;
  }

  len = requestInterceptorChain.length;

  var newConfig = config;

  i = 0;

  while (i < len) {
    var onFulfilled = requestInterceptorChain[i++];
    var onRejected = requestInterceptorChain[i++];
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected.call(this, error);
      break;
    }
  }

  try {
    promise = dispatchRequest.call(this, newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  i = 0;
  len = responseInterceptorChain.length;

  while (i < len) {
    promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url: url,
        data: data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

module.exports = Axios;
