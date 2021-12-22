import http from '@ohos.net.http'
import { statusMap } from '../helpers/statusMap';

var settle = require('../core/settle');
var buildFullPath = require('../core/buildFullPath');
var VERSION = require('../env/data').version;
var Cancel = require('../cancel/Cancel');

/*eslint consistent-return:0*/
module.exports = function ohosAdapter(config) {
  return new Promise(function dispatchHttpRequest(resolvePromise, rejectPromise) {
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }
    var resolve = function resolve(value) {
      done();
      resolvePromise(value);
    };
    var rejected = false;
    var reject = function reject(value) {
      done();
      rejected = true;
      rejectPromise(value);
    };
    var data = config.data;
    var headers = config.headers;
    var headerNames = {};

    Object.keys(headers).forEach(function storeLowerName(name) {
      headerNames[name.toLowerCase()] = name;
    });

    // Set User-Agent (required by some servers)
    // See https://github.com/axios/axios/issues/69
    if ('user-agent' in headerNames) {
      // User-Agent is specified; handle case where no UA header is desired
      if (!headers[headerNames['user-agent']]) {
        delete headers[headerNames['user-agent']];
      }
      // Otherwise, use specified value
    } else {
      // Only set header if it hasn't been set in config
      headers['User-Agent'] = 'axios/' + VERSION;
    }

    // Parse url
    var fullPath = buildFullPath(config.baseURL, config.url);

    var options = {
      method: config.method.toUpperCase(),
      header: headers,
      extraData: config.data
    };

    if (config.timeout) {
      var timeout = parseInt(config.timeout, 10);
      options.connectTimeout = timeout;
      options.readTimeout = timeout;
    }

    var transport;
    if (config.transport) {
      transport = config.transport;
    } else {
      // Create a http request, it can't be reused
      transport = http.createHttp();
    }

    if (config.cancelToken || config.signal) {
      onCanceled = function(cancel) {
        transport.destroy();
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel)
      }
    }

    transport.request(fullPath, options, function handleResponse(err, res) {
      var response = {
        data: res.result,
        status: res.responseCode,
        statusText: statusMap[res.responseCode],
        headers: res.header,
        config: config
      }
      settle(resolve, reject, response);
    })
  })
};
