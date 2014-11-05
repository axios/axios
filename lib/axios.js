var Promise = require('es6-promise').Promise;
var defaults = require('./defaults');
var utils = require('./utils');

function axiosCore(config) {
  var promise = new Promise(function (resolve, reject) {
    try {
      // Check for custom adapter first
      if (typeof config.adapter === "function") {
        config.adapter(resolve, reject, config);
      }
      // For browsers use XHR adapter
      else if (typeof window !== 'undefined') {
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

  function deprecatedMethod(method, instead, docs) {
    try {
      console.warn(
        'DEPRECATED method `' + method + '`.' +
        (instead ? ' Use `' + instead + '` instead.' : '') +
        ' This method will be removed in a future release.');

      if (docs) {
        console.warn('For more information about usage see ' + docs);
      }
    } catch (e) {}
  }

  // Provide alias for success
  promise.success = function success(fn) {
    deprecatedMethod('success', 'then', 'https://github.com/mzabriskie/axios/blob/master/README.md#response-api');

    promise.then(function(response) {
      fn(response.data, response.status, response.headers, response.config);
    });
    return promise;
  };

  // Provide alias for error
  promise.error = function error(fn) {
    deprecatedMethod('error', 'catch', 'https://github.com/mzabriskie/axios/blob/master/README.md#response-api');

    promise.then(null, function(response) {
      fn(response.data, response.status, response.headers, response.config);
    });
    return promise;
  };

  return promise;
}


function createAxios(defaultConfig) {
  defaultConfig = defaultConfig || {};
  function axios(config) {
    config = utils.merge({
      method: 'get',
      headers: {},
      transformRequest: defaults.transformRequest,
      transformResponse: defaults.transformResponse
    }, defaultConfig, config);

    // Don't allow overriding defaults.withCredentials
    config.withCredentials = config.withCredentials || defaults.withCredentials;

    // Handle headers separately so individual custom headers can be set
    config.headers = utils.merge({}, defaultConfig.headers, config.headers);

    return axiosCore(config);
  }

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

  // Expose defaults
  axios.defaults = defaults;

  // Expose all/spread
  axios.all = function (promises) {
    return Promise.all(promises);
  };
  axios.spread = require('./helpers/spread');

  // Provide aliases for supported request methods
  createShortMethods('delete', 'get', 'head');
  createShortMethodsWithData('post', 'put', 'patch');

  // Expose createAxios for end users too
  axios.createAxios = createAxios;

  return axios;
}

module.exports = createAxios();
