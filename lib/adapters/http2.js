var http2 = require('http2');
var fs = require('fs');
var buildFullPath = require('../core/buildFullPath');
var buildURL = require('./../helpers/buildURL');

/*
 * To enable http2, set axios' defaults "experimental_http2" property on your config to true
 * before creating an axios instance or doing any requests
 * > axios.defaults.experimental_http2 = true;
 * 
 * Config can take existing Axios settings plus:
 * - certificateURL: relative path for the URLof the certificate to connect to the HTTP/2 server
 */
module.exports = function http2Adapter(config) {
  return new Promise(function (resolve, reject) {
    var fullPath = buildFullPath(config.baseURL, config.url);
    var parsed = url.parse(fullPath);
    var path = buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, '');s
    var client = http2.connect(path, {
      ca: fs.readFileSync(config.certificateURL)
    });
    var protocol = parsed.protocol || 'http:';
    var clientHttp2Stream = client.request({ ':path': path, ':method': config.method });

    client.on('error', (err) => {
      reject(err);
    });

    var data;

    clientHttp2Stream.setEncoding('utf8');
    clientHttp2Stream.on('response', (headers, flags) => {
      resolve();
    });

    clientHttp2Stream.on('data', (chunk) => {
      data += chunk;
    })

    clientHttp2Stream.on('end', () => {
      resolve(data);
      client.close();
    })

    clientHttp2Stream.on('error', (err) => {
      reject(err);
    })
  })
}