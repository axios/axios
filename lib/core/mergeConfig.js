'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  utils.forEach(['url', 'method', 'params', 'data'], function valueFromConfig2(prop) {
    config[prop] = config2[prop];
  });

  utils.forEach(['headers', 'auth', 'proxy'], function mergeValues(prop) {
    if (typeof config2[prop] !== 'undefined') {
      if (typeof config2[prop] === 'object') {
        config[prop] = utils.deepMerge(config1[prop], config2[prop]);
      } else {
        config[prop] = config2[prop];
      }
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = utils.deepMerge(config1[prop]);
    }
  });

  utils.forEach([
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'maxContentLength',
    'validateStatus', 'maxRedirects', 'httpAgent', 'httpsAgent', 'cancelToken'
  ], function defaultToConfig2(prop) {
    config[prop] = typeof config2[prop] === 'undefined' ? config1[prop] : config2[prop];
  });

  return config;
};
