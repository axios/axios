var Promise = require('es6-promise').Promise;
var buildUrl = require('./buildUrl');
var defaults = require('./defaults');
var forEach = require('./forEach');
var merge = require('./merge');
var parseHeaders = require('./parseHeaders');
var transformData = require('./transformData');

var axios = module.exports = function axios(options) {
  options = merge({
    method: 'get',
    transformRequest: defaults.transformRequest,
    transformResponse: defaults.transformResponse
  }, options);

  // Don't allow overriding defaults.withCredentials
  options.withCredentials = options.withCredentials || defaults.withCredentials;

  var promise = new Promise(function (resolve, reject) {
    // Create the request
    var request = new(XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');
    var data = transformData(
      options.data,
      options.headers,
      options.transformRequest
    );

    // Open the request
    request.open(options.method, buildUrl(options.url, options.params), true);

    // Listen for ready state
    request.onreadystatechange = function () {
      if (request && request.readyState === 4) {
        // Prepare the response
        var headers = parseHeaders(request.getAllResponseHeaders());
        var response = {
          data: transformData(
            request.responseText,
            headers,
            options.transformResponse
          ),
          status: request.status,
          headers: headers,
          config: options
        };

        // Resolve or reject the Promise based on the status
        if (request.status >= 200 && request.status < 300) {
          resolve(response);
        } else {
          reject(response);
        }

        // Clean up request
        request = null;
      }
    };

    // Merge headers and add to request
    var headers = merge(
      defaults.headers.common,
      defaults.headers[options.method] || {},
      options.headers || {}
    );

    forEach(headers, function (val, key) {
      // Remove Content-Type if data is undefined
      if (typeof data === 'undefined' && key.toLowerCase() === 'content-type') {
        delete headers[key];
      }
      // Otherwise add header to the request
      else {
        request.setRequestHeader(key, val);
      }
    });

    // Add withCredentials to request if needed
    if (options.withCredentials) {
      request.withCredentials = true;
    }

    // Add responseType to request if needed
    if (options.responseType) {
      try {
        request.responseType = options.responseType;
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
  forEach(arguments, function (method) {
    axios[method] = function (url, options) {
      return axios(merge(options || {}, {
        method: method,
        url: url
      }));
    };
  });
}

function createShortMethodsWithData() {
  forEach(arguments, function (method) {
    axios[method] = function (url, data, options) {
      return axios(merge(options || {}, {
        method: method,
        url: url,
        data: data
      }));
    };
  });
}