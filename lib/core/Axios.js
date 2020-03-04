'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

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
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(rawConfig) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof rawConfig === 'string') {
    rawConfig = arguments[1] || {};
    rawConfig.url = arguments[0];
  } else {
    rawConfig = rawConfig || {};
  }

  var config = mergeConfig(this.defaults, rawConfig);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  // Collect interceptors middleware
  var middlewareRegistry = [];

  this.interceptors.request.forEach(function(interceptor) {
    middlewareRegistry.push(interceptor);
  });

  middlewareRegistry.push({
    fulfilled: function(reqConfig) {
      return dispatchRequest(reqConfig, rawConfig);
    }
  });

  this.interceptors.response.forEach(function(interceptor) {
    middlewareRegistry.push(interceptor);
  });

  // Hook up middleware
  var promise = Promise.resolve(config);

  utils.forEach(middlewareRegistry, function(middleware) {
    promise = promise.then(middleware.fulfilled, middleware.rejected);
  });

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;
