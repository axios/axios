'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var buildFullPath = require('./buildFullPath');
var validator = require('../helpers/validator');

var validators = validator.validators;

function captureCallerStack(boundary) {
  var caller = {};
  try {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(caller, boundary);
    } else {
      caller = new Error();
    }
  } catch (e) {
    // Stack hooks must not prevent a request from being sent.
  }
  return caller;
}

function attachCallerStack(promise, caller) {
  if (!caller) {
    return promise;
  }

  return promise.then(null, function onRequestRejected(error) {
    try {
      if (error instanceof Error || Object.prototype.toString.call(error) === '[object Error]') {
        // Capture at dispatch time, but only format the stack on failure.
        // Capturing in this callback would lose callers using .then/.catch.
        var stack = caller.stack;
        if (typeof stack === 'string') {
          var newline = stack.indexOf('\n');
          stack = newline === -1 ? '' : stack.slice(newline + 1);
          var original = error.stack;
          if (stack && (original === undefined || original === null || original === '')) {
            error.stack = stack;
          } else if (stack && typeof original === 'string' && original.indexOf(stack) === -1) {
            error.stack = original + '\n' + stack;
          }
        }
      }
    } catch (e) {
      // Frozen errors and custom stack accessors must retain their rejection.
    }
    return Promise.reject(error);
  });
}

function dispatchAfterRecovery(config) {
  return function dispatchRecoveredRequest() {
    return dispatchRequest(config);
  };
}

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
  var caller = config.captureCallerStack === true ? captureCallerStack(request) : null;

  // Set config.method. The merged config is null-prototype, but instance
  // defaults may be an ordinary object, so the fallback is read as an own
  // property to keep an inherited value from choosing the request method.
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (utils.hasOwnProperty(this.defaults, 'method') && this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  var paramsSerializer = config.paramsSerializer;

  if (paramsSerializer != null) {
    if (utils.isFunction(paramsSerializer)) {
      config.paramsSerializer = {
        serialize: paramsSerializer
      };
    } else {
      validator.assertOptions(paramsSerializer, {
        encode: validators.function,
        serialize: validators.function
      }, true);
    }
  }

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

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return attachCallerStack(promise, caller);
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled ? onFulfilled(newConfig) : newConfig;
    } catch (error) {
      if (!onRejected) {
        promise = Promise.reject(error);
        break;
      }
      try {
        var recovery = onRejected(error);
        if (recovery && typeof recovery.then === 'function') {
          promise = Promise.resolve(recovery).then(dispatchAfterRecovery(newConfig));
        }
      } catch (rejectedError) {
        promise = Promise.reject(rejectedError);
      }
      break;
    }
  }

  if (!promise) {
    try {
      promise = dispatchRequest(newConfig);
    } catch (error) {
      // Dispatch errors, including pre-aborted signals, still go through the
      // response interceptors registered below.
      promise = Promise.reject(error);
    }
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return attachCallerStack(promise, caller);
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    var requestConfig = config || {};

    return this.request(mergeConfig(requestConfig, {
      method: method,
      url: url,
      data: utils.hasOwnProperty(requestConfig, 'data') ? requestConfig.data : undefined
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
