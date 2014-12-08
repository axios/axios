var Promise = require('es6-promise').Promise;
var defaults = require('./defaults');
var utils = require('./utils');

var axios = module.exports = function axios(config) {
  config = utils.merge({
    method: 'get',
    headers: {},
    transformRequest: defaults.transformRequest,
    transformResponse: defaults.transformResponse
  }, config);

  // Don't allow overriding defaults.withCredentials
  config.withCredentials = config.withCredentials || defaults.withCredentials;

  var serverRequest = function (config) {
    return new Promise(function (resolve, reject) {
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
  };

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

  var chain = [serverRequest, undefined];
  var promise = Promise.resolve(config);

  utils.forEach(axios.interceptors.request.handlers, function (interceptor) {
    chain.unshift(interceptor.request, interceptor.requestError);
  });

  utils.forEach(axios.interceptors.response.handlers, function (interceptor) {
    chain.push(interceptor.response, interceptor.responseError);
  });

  while (chain.length) {
    var thenFn = chain.shift();
    var rejectFn = chain.shift();

    promise = promise.then(thenFn, rejectFn);
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
};

// Expose defaults
axios.defaults = defaults;

// Expose all/spread
axios.all = function (promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// interceptors
axios.interceptors = {
  request: {
    handlers: [],
    use: function (thenFn, rejectFn) {
      axios.interceptors.request.handlers.push({ request: thenFn, requestError: rejectFn });
    }
  },
  response: {
    handlers: [],
    use: function (thenFn, rejectFn) {
      axios.interceptors.response.handlers.push({ response: thenFn, responseError: rejectFn });
    }
  }
};

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
