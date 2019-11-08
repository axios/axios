var http2 = require('http2');
var fs = require('fs');
var url = require('url');
var buildFullPath = require('../core/buildFullPath');
var buildURL = require('./../helpers/buildURL');

/*
 * config param can take existing Axios settings plus:
 * certificatePath: relative path for the URLof the certificate to connect to the HTTP/2 server
 */
module.exports = function http2Adapter(config) {
  return new Promise(function (resolve, reject) {
    var method = config.method.toUpperCase();
    var fullPath = buildFullPath(config.baseURL, config.url);
    var parsed = url.parse(fullPath);
    var path = buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, '');
    var requestData = config.data;
    var client = http2.connect(parsed.href, {
      ca: [fs.readFileSync(config.certificatePath).toString()]
    });
    var protocol = parsed.protocol || 'http:';
    var BODY_REQUIRED_METHODS = ['POST', 'PUT', 'PATCH'];
    var requestContainsBody =  BODY_REQUIRED_METHODS.indexOf(method.toUpperCase()) >= 0;

    var request = client.request({
      ':path': parsed.path,
      ':method': method,
    }, { endStream: !requestContainsBody });

    client.on('error', function(err) {
      reject(err);
    });

    var responseData = '';

    request.setEncoding('utf8');

    request.on('response', function(headers, flags) {
      for (const name in headers) {
        console.log(`${name}: ${headers[name]}`);
      }
    });

    request.on('data', function(chunk) {
      responseData += chunk;
    });

    request.on('end', function() {
      resolve({ data: responseData });
      client.close();
    });

    request.on('error', function(err) {
      reject(err);
    });

    request.end(JSON.stringify(requestData));
  })
}