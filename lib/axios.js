'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var isAxiosError = require('./helpers/isAxiosError');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  // Listen to unhandled rejected axios promises
  function useDefaultReject(axiosError, unhandledPromiseEvent, promise) {
    if (
      isAxiosError(axiosError) &&
      typeof instance.defaults.defaultReject === 'function' &&
      // Only execute the defaultReject of the axios instance that was used
      axiosError.config._instanceId === instance._instanceId
    ) {
      promise.catch(function catchUnhandledPromise() {
        instance.defaults.defaultReject(axiosError);
        if (typeof unhandledPromiseEvent.preventDefault === 'function') {
          unhandledPromiseEvent.preventDefault();
        }
      });
    }
  }

  if (utils.isNodeEnv()) {
    // For node use process.addListener
    process.addListener('unhandledRejection', function handleServerSideUnhandledRejection(e, promise) {
      useDefaultReject(e, e, promise);
    });
  } else if (typeof window !== 'undefined') {
    // For browsers use window.addEventListener
    window.addEventListener('unhandledrejection', function handleBrowserSideUnhandledRejection(e) {
      useDefaultReject(e.reason, e, e.promise);
    });
  }

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;
