'use strict';

var defaults = require('./../defaults');
var utils = require('./../utils');
var buildUrl = require('./../helpers/buildUrl');
var transformData = require('./../helpers/transformData');
var http = require('http');
var https = require('https');
var url = require('url');
var pkg = require('./../../package.json');
var Buffer = require('buffer').Buffer;

module.exports = function httpAdapter(resolve, reject, config) {
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

  // Set User-Agent (required by some servers)
  headers['User-Agent'] = 'axios/' + pkg.version;

  if (data) {
    if (utils.isArrayBuffer(data)) {
      data = new Buffer(new Uint8Array(data));
    } else if (utils.isString(data)) {
      data = new Buffer(data, 'utf-8');
    } else {
      return reject(new Error('Data after transformation must be a string or an ArrayBuffer'));
    }

    // Add Content-Length header if data exists
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
  var transport = parsed.protocol === 'https:' ? https : http;
  var req = transport.request(options, function (res) {
    var responseBuffer = [];
    res.on('data', function (chunk) {
      responseBuffer.push(chunk);
    });

    res.on('end', function () {
      var response = {
        data: transformData(
          Buffer.concat(responseBuffer).toString('utf8'),
          res.headers,
          config.transformResponse
        ),
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config
      };

      // Resolve or reject the Promise based on the status
      (res.statusCode >= 200 && res.statusCode < 300 ?
        resolve :
        reject)(response);
    });
  });

  // Handle errors
  req.on('error', function (err) {
    reject(err);
  });

  // Send the request
  req.end(data);
};
