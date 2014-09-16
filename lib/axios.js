var Promise = require('es6-promise').Promise;
var defaults = require('./defaults');
var utils = require('./utils');
var spread = require('./spread');

var axios = module.exports = function axios(config) {
  config = utils.merge({
    method: 'get',
    transformRequest: defaults.transformRequest,
    transformResponse: defaults.transformResponse
  }, config);

  // Don't allow overriding defaults.withCredentials
  config.withCredentials = config.withCredentials || defaults.withCredentials;

  var promise = new Promise(function (resolve, reject) {
    try {
      // For browsers use XHR adapter
      if (typeof window !== 'undefined') {
        require('./adapters/xhr')(resolve, reject, config);
      }
      // For node use HTTP adapter
      else if (typeof process !== 'undefined') {
        require('./adapters/http')(resolve, reject, config);
      }
    } catch (e) {
      reject(e);
    }
  });

  // Provide alias for success
  promise.success = function success(fn) {
    promise.then(function(response) {
      fn(response.data, response.status, response.headers, response.config);
    });
    return promise;
  };

  // Provide alias for error
  promise.error = function error(fn) {
    promise.then(null, function(response) {
      fn(response.data, response.status, response.headers, response.config);
    });
    return promise;
  };

  return promise;
};

// Expose defaults
axios.defaults = defaults;

// Expose all/spread
axios.all = Promise.all;
axios.spread = spread;

// Provide aliases for supported request methods
createShortMethods('delete', 'get', 'head');
createShortMethodsWithData('post', 'put', 'patch');

function createShortMethods() {
  utils.forEach(arguments, function (method) {
    axios[method] = function (url, config) {
      return axios(utils.merge(config || {}, {
        method: method,
        url: url
      }));
    };
  });
}

function createShortMethodsWithData() {
  utils.forEach(arguments, function (method) {
    axios[method] = function (url, data, config) {
      return axios(utils.merge(config || {}, {
        method: method,
        url: url,
        data: data
      }));
    };
  });
}