var Promise = require('es6-promise').Promise;
var buildUrl = require('./buildUrl');
var cookies = require('./cookies');
var defaults = require('./defaults');
var parseHeaders = require('./parseHeaders');
var transformData = require('./transformData');
var urlIsSameOrigin = require('./urlIsSameOrigin');
var utils = require('./utils');

var axios = module.exports = function axios(config) {
  config = utils.merge({
    method: 'get',
    transformRequest: defaults.transformRequest,
    transformResponse: defaults.transformResponse
  }, config);

  // Don't allow overriding defaults.withCredentials
  config.withCredentials = config.withCredentials || defaults.withCredentials;

  var promise = new Promise(function (resolve, reject) {
    // Create the request
    var request = new(XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');
    var data = transformData(
      config.data,
      config.headers,
      config.transformRequest
    );

    // Open the request
    request.open(config.method, buildUrl(config.url, config.params), true);

    // Listen for ready state
    request.onreadystatechange = function () {
      if (request && request.readyState === 4) {
        // Prepare the response
        var headers = parseHeaders(request.getAllResponseHeaders());
        var response = {
          data: transformData(
            request.responseText,
            headers,
            config.transformResponse
          ),
          status: request.status,
          headers: headers,
          config: config
        };

        // Resolve or reject the Promise based on the status
        (request.status >= 200 && request.status < 300
          ? resolve
          : reject)(
            response.data,
            response.status,
            response.headers,
            response.config
          );

        // Clean up request
        request = null;
      }
    };

    // Merge headers and add to request
    var headers = utils.merge(
      defaults.headers.common,
      defaults.headers[config.method] || {},
      config.headers || {}
    );

    // Add xsrf header
    var xsrfValue = urlIsSameOrigin(config.url)
        ? cookies.read(config.xsrfCookieName || defaults.xsrfCookieName)
        : undefined;
    if (xsrfValue) {
      headers[config.xsrfHeaderName || defaults.xsrfHeaderName] = xsrfValue;
    }

    utils.forEach(headers, function (val, key) {
      // Remove Content-Type if data is undefined
      if (!data && key.toLowerCase() === 'content-type') {
        delete headers[key];
      }
      // Otherwise add header to the request
      else {
        request.setRequestHeader(key, val);
      }
    });

    // Add withCredentials to request if needed
    if (config.withCredentials) {
      request.withCredentials = true;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        if (request.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Send the request
    request.send(data);
  });

  // Provide alias for success
  promise.success = function success(fn) {
    promise.then(function(response) {
      fn(response);
    });
    return promise;
  };

  // Provide alias for error
  promise.error = function error(fn) {
    promise.then(null, function(response) {
      fn(response);
    });
    return promise;
  };

  return promise;
};

// Expose defaults
axios.defaults = defaults;

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