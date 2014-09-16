var buildUrl = require('./../buildUrl');
var cookies = require('./../cookies');
var defaults = require('./../defaults');
var parseHeaders = require('./../parseHeaders');
var transformData = require('./../transformData');
var urlIsSameOrigin = require('./../urlIsSameOrigin');
var utils = require('./../utils');

module.exports = function xhrAdapter(resolve, reject, config) {
  // Transform request data
  var data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Merge headers
  var headers = utils.merge(
    defaults.headers.common,
    defaults.headers[config.method] || {},
    config.headers || {}
  );

  // Create the request
  var request = new(XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');
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
        : reject)(response);

      // Clean up request
      request = null;
    }
  };

  // Add xsrf header
  var xsrfValue = urlIsSameOrigin(config.url)
    ? cookies.read(config.xsrfCookieName || defaults.xsrfCookieName)
    : undefined;
  if (xsrfValue) {
    headers[config.xsrfHeaderName || defaults.xsrfHeaderName] = xsrfValue;
  }

  // Add headers to the request
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
};