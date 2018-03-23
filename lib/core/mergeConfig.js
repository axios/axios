'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * based on given defaults and instance config.
 *
 * @param {Object} defaults Defaults
 * @param {Object} instanceConfig Instance-specific config
 * @returns {Object} New object resulting from merging instanceConfig to defaults
 */
module.exports = function mergeConfig(defaults, instanceConfig) {
  // eslint-disable-next-line no-param-reassign
  instanceConfig = instanceConfig || {};
  var config = {};

  utils.forEach(['url', 'method', 'params', 'data'], function valueFromInstanceConfig(prop) {
    config[prop] = instanceConfig[prop];
  });

  utils.forEach(['headers', 'auth', 'proxy'], function mergeInstanceConfigWithDefaults(prop) {
    if (typeof instanceConfig[prop] !== 'undefined') {
      if (typeof instanceConfig[prop] === 'object') {
        config[prop] = utils.deepMerge(defaults[prop], instanceConfig[prop]);
      } else {
        config[prop] = instanceConfig[prop];
      }
    } else if (typeof defaults[prop] !== 'undefined') {
      config[prop] = utils.deepMerge(defaults[prop]);
    }
  });

  utils.forEach([
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'maxContentLength',
    'validateStatus', 'maxRedirects', 'httpAgent', 'httpsAgent', 'cancelToken'
  ], function defaultToInstanceConfig(prop) {
    config[prop] = typeof instanceConfig[prop] === 'undefined' ? defaults[prop] : instanceConfig[prop];
  });

  return config;
};
