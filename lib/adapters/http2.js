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
    var fullPath = buildFullPath(config.baseURL, config.url);
    var parsed = url.parse(fullPath);
    var path = buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, '');
    var client = http2.connect(parsed.href, {
      ca: [fs.readFileSync(config.certificatePath).toString()]
    });
    var protocol = parsed.protocol || 'http:';
    var req = client.request({
      ':path': parsed.path,
    });

    client.on('error', (err) => {
      reject(err);
    });

    var data = '';

    req.setEncoding('utf8');
    req.on('response', (headers, flags) => {
      console.log("RESPONSE");
      for (const name in headers) {
        console.log(`${name}: ${headers[name]}`);
      }
    });

    req.on('data', (chunk) => {
      console.log("CHUNK");
      data += chunk;
    })

    req.on('end', () => {
      resolve({ data });
      client.close();
    })

    req.on('error', (err) => {
      reject(err);
    })
  })
}