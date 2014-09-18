var buildUrl = require('./../buildUrl');
var defaults = require('./../defaults');
var transformData = require('./../transformData');
var utils = require('./../utils');
var http = require('http');
var url = require('url');
var Buffer = require('buffer').Buffer;

module.exports = function httpAdapter(resolve, reject, config) {
  // Transform request data
  var data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  if (utils.isArrayBuffer(data)) {
    data = new Buffer(new Uint8Array(data));
  }

  // Merge headers
  var headers = utils.merge(
    defaults.headers.common,
    defaults.headers[config.method] || {},
    config.headers || {}
  );

  // Add Content-Length header if data exists
  if (data) {
    headers['Content-Length'] = data.length;
  }

  // Parse url
  var parsed = url.parse(config.url);
  var options = {
    host: parsed.hostname,
    port: parsed.port,
    path: buildUrl(parsed.path, config.params).replace(/^\?/, ''),
    method: config.method,
    headers: headers
  };

  // Create the request
  var req = http.request(options, function (res) {
    var responseText = '';
    res.on('data', function (chunk) {
      responseText += chunk;
    });

    res.on('end', function () {
      var response = {
        data: transformData(
          responseText,
          res.headers,
          config.transformResponse
        ),
        status: res.statusCode,
        headers: res.headers,
        config: config
      };

      // Resolve or reject the Promise based on the status
      (res.statusCode >= 200 && res.statusCode < 300
        ? resolve
        : reject)(response);
    });
  });

  // Send the request
  req.end(data);
};