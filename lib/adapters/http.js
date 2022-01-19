'use strict';

var Readable = require('stream').Readable;
var utils = require('./../utils');
var EventEmitter = require('events').EventEmitter;
var settle = require('./../core/settle');
var buildFullPath = require('../core/buildFullPath');
var buildURL = require('./../helpers/buildURL');
var http = require('http');
var https = require('https');
var httpFollow = require('follow-redirects').http;
var httpsFollow = require('follow-redirects').https;
var url = require('url');
var zlib = require('zlib');
var VERSION = require('./../env/data').version;
var createError = require('../core/createError');
var enhanceError = require('../core/enhanceError');
var defaults = require('../defaults');
var Cancel = require('../cancel/Cancel');
var Headers = require('../helpers/headers');

var isHttps = /https:?/;

// in node.js v4+ Buffer is a subclass of Uint8Array
function isLikeBuffer(thing) {
  return thing instanceof Uint8Array;
}

function toBuffer(thing) {
  try {
    return isLikeBuffer(thing) ? thing : Buffer.from(thing);
    // eslint-disable-next-line no-empty
  } catch (e) {
    // nothing to do
  }

  return null;
}

function toStream(target, chunkSize) {
  if (!target) return null;

  if (utils.isStream(target)) {
    return target;
  }

  // eslint-disable-next-line no-param-reassign
  chunkSize = chunkSize || 65536;

  var offset = 0;

  return new Readable({
    highWaterMark: chunkSize,
    read: function read() {
      var buf = target.slice(offset, offset + chunkSize);
      var len = buf.length;
      offset += len;
      if (!buf.length) {
        this.push(null);
        return;
      }
      this.push(buf);
    }
  });
}

function monitorStream(stream, onProgress) {
  var bytesSeen = 0;
  var captureListener = function onData(chunk) {
    bytesSeen += chunk.length;
    onProgress(bytesSeen, chunk);
  };

  captureListener.__capture = true;

  function isCaptureListener(listener) {
    return listener && listener.__capture;
  }

  function hasExternalDataListeners() {
    // eslint-disable-next-line func-names
    return stream.listeners('data').some(function(listener) {
      return !isCaptureListener(listener);
    });
  }

  var isCaptured = false;

  stream.on('newListener', function onNewListener(event, listener) {
    if (isCaptured || event !== 'data' || isCaptureListener(listener)) {
      return;
    }
    isCaptured = true;
    EventEmitter.prototype.on.call(stream, 'data', captureListener);
  });

  stream.on('removeListener', function onRemoveListener(event, listener) {
    if (!isCaptured || event !== 'data' || isCaptureListener(listener) || hasExternalDataListeners()) {
      return;
    }
    isCaptured = false;
    EventEmitter.prototype.off.call(stream, 'data', captureListener);
  });

  stream.on('end', function onEnd() {
    onProgress(bytesSeen);
  });
}

/**
 * Throttle decorator
 * @param {Function} fn
 * @param {Number} freq
 * @return {Function}
 */
function throttle(fn, freq) {
  var timestamp = 0;
  var threshold = 1000 / freq;
  return function throttled(force, args) {
    var now = Date.now();
    if ( force || now - timestamp > threshold) {
      timestamp = now;
      fn.apply(null, args);
    }
  };
}

function pump(streams) {
  return streams.reduce(function each(source, dest) {
    source.on('error', function onPipeError(err) {
      dest.destroy(err);
    }).pipe(dest);
    return dest;
  });
}

/**
 * Capture stream progress
 * @param {Stream} stream
 * @param {Number} expectedLength how many bytes will be transferred through the stream
 * @param {Function} onProgress
 * @param {Number} [sps= 10] Progress samples per second limit
 */

function captureStreamProgress(stream, expectedLength, onProgress, sps) {
  var notifiedBytesLoaded = 0;
  var throttledHandler = throttle(function throttledHandler(bytesLoaded) {
    notifiedBytesLoaded = bytesLoaded;
    onProgress({
      'loaded': bytesLoaded,
      'total': expectedLength,
      'progress': expectedLength && (bytesLoaded / expectedLength)
    });
  }, sps || 10);

  // eslint-disable-next-line func-names
  monitorStream(stream, function(bytesLoaded, chunk) {
    bytesLoaded !== notifiedBytesLoaded && throttledHandler(!chunk, [bytesLoaded]);
  });
}

/**
 *
 * @param {http.ClientRequestArgs} options
 * @param {AxiosProxyConfig} proxy
 * @param {string} location
 */
function setProxy(options, proxy, location) {
  options.hostname = proxy.host;
  options.host = proxy.host;
  options.port = proxy.port;
  options.path = location;

  // Basic proxy authorization
  if (proxy.auth) {
    var base64 = Buffer.from(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64');
    options.headers['Proxy-Authorization'] = 'Basic ' + base64;
  }

  // If a proxy is used, any redirects must also pass through the proxy
  options.beforeRedirect = function beforeRedirect(redirection) {
    redirection.headers.host = redirection.host;
    setProxy(redirection, proxy, redirection.href);
  };
}

/*eslint consistent-return:0*/
module.exports = function httpAdapter(config) {
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
    var headers = new Headers(config.headers, {
      'User-Agent': 'axios/' + VERSION,
      'Content-Type': undefined,
      'Content-Length': undefined
    });

    var onDownloadProgress = config.onDownloadProgress;
    var onUploadProgress = config.onUploadProgress;
    var contentLength = headers.get('content-length');

    if (data) {
      if (!utils.isStream(data)) {
        data = toBuffer(data);

        if (!data) {
          return reject(createError(
            'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
            config
          ));
        }

        // Add Content-Length header if data exists
        contentLength = headers.get('content-length', data.length);

        if (config.maxBodyLength > -1 && contentLength > config.maxBodyLength) {
          return reject(createError('Request body larger than maxBodyLength limit', config));
        }

        if (onUploadProgress) {
          data = toStream(data);
        }
      }
    }

    // HTTP basic authentication
    var auth = undefined;
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      auth = username + ':' + password;
    }

    // Parse url
    var fullPath = buildFullPath(config.baseURL, config.url);
    var parsed = url.parse(fullPath);
    var protocol = parsed.protocol || 'http:';

    if (!auth && parsed.auth) {
      var urlAuth = parsed.auth.split(':');
      var urlUsername = urlAuth[0] || '';
      var urlPassword = urlAuth[1] || '';
      auth = urlUsername + ':' + urlPassword;
    }

    // Delete authorization header
    auth && headers.set('authorization', null);

    var isHttpsRequest = isHttps.test(protocol);
    var agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;

    try {
      buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, '');
    } catch (err) {
      var customErr = new Error(err.message);
      customErr.config = config;
      customErr.url = config.url;
      customErr.exists = true;
      return reject(customErr);
    }

    var options = {
      path: buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: config.method.toUpperCase(),
      headers: headers.toJSON(),
      agent: agent,
      agents: { http: config.httpAgent, https: config.httpsAgent },
      auth: auth
    };

    if (config.socketPath) {
      options.socketPath = config.socketPath;
    } else {
      options.hostname = parsed.hostname;
      options.port = parsed.port;
    }

    var proxy = config.proxy;
    if (!proxy && proxy !== false) {
      var proxyEnv = protocol.slice(0, -1) + '_proxy';
      var proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];
      if (proxyUrl) {
        var parsedProxyUrl = url.parse(proxyUrl);
        var noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
        var shouldProxy = true;

        if (noProxyEnv) {
          var noProxy = noProxyEnv.split(',').map(function trim(s) {
            return s.trim();
          });

          shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
            if (!proxyElement) {
              return false;
            }
            if (proxyElement === '*') {
              return true;
            }
            if (proxyElement[0] === '.' &&
                parsed.hostname.substr(parsed.hostname.length - proxyElement.length) === proxyElement) {
              return true;
            }

            return parsed.hostname === proxyElement;
          });
        }

        if (shouldProxy) {
          proxy = {
            host: parsedProxyUrl.hostname,
            port: parsedProxyUrl.port,
            protocol: parsedProxyUrl.protocol
          };

          if (parsedProxyUrl.auth) {
            var proxyUrlAuth = parsedProxyUrl.auth.split(':');
            proxy.auth = {
              username: proxyUrlAuth[0],
              password: proxyUrlAuth[1]
            };
          }
        }
      }
    }

    if (proxy) {
      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '');
      setProxy(options, proxy, protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path);
    }

    var transport;
    var isHttpsProxy = isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true);
    if (config.transport) {
      transport = config.transport;
    } else if (config.maxRedirects === 0) {
      transport = isHttpsProxy ? https : http;
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects;
      }
      transport = isHttpsProxy ? httpsFollow : httpFollow;
    }

    options.maxBodyLength = config.maxBodyLength;

    if (config.insecureHTTPParser) {
      options.insecureHTTPParser = config.insecureHTTPParser;
    }

    // Create the request
    var req = transport.request(options, function handleResponse(res) {
      if (req.aborted) return;

      // uncompress the response body transparently if required
      var stream = res;

      // return the last request in case of redirects
      var lastRequest = res.req || req;

      var responseHeaders = new Headers(res.headers);

      // if no content, is HEAD request or decompress disabled we should not decompress
      if (res.statusCode !== 204 && lastRequest.method !== 'HEAD' && config.decompress !== false) {
        switch (responseHeaders.get('content-encoding')) {
        /*eslint default-case:0*/
        case 'gzip':
        case 'compress':
        case 'deflate':
        // add the unzipper to the body stream processing pipeline
          stream = pump([stream, zlib.createUnzip()]);

          // remove the content-encoding in order to not confuse downstream operations
          responseHeaders.set('content-encoding', null);
          break;
        }
      }

      var responseContentLength = +(responseHeaders.get('content-length') || 0);

      onDownloadProgress && captureStreamProgress(stream, responseContentLength, onDownloadProgress);

      var response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: responseHeaders.toJSON(),
        config: config,
        request: lastRequest
      };

      if (config.responseType === 'stream') {
        response.data = stream;
        settle(resolve, reject, response);
      } else {
        var responseBuffer = [];
        var totalResponseBytes = 0;
        stream.on('data', function handleStreamData(chunk) {
          responseBuffer.push(chunk);
          totalResponseBytes += chunk.length;

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength > -1 && totalResponseBytes > config.maxContentLength) {
            // stream.destroy() emit aborted event before calling reject() on Node.js v16
            rejected = true;
            stream.destroy();
            reject(createError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              config, null, lastRequest));
          }
        });

        stream.on('aborted', function handlerStreamAborted() {
          if (rejected) {
            return;
          }
          stream.destroy();
          reject(createError('error request aborted', config, 'ERR_REQUEST_ABORTED', lastRequest));
        });

        stream.on('error', function handleStreamError(err) {
          if (req.aborted) return;
          reject(enhanceError(err, config, null, lastRequest));
        });

        stream.on('end', function handleStreamEnd() {
          try {
            var responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
            if (config.responseType !== 'arraybuffer') {
              responseData = responseData.toString(config.responseEncoding);
              if (!config.responseEncoding || config.responseEncoding === 'utf8') {
                responseData = utils.stripBOM(responseData);
              }
            }
            response.data = responseData;
          } catch (err) {
            reject(enhanceError(err, config, err.code, response.request, response));
          }
          settle(resolve, reject, response);
        });
      }
    });

    // Handle errors
    req.on('error', function handleRequestError(err) {
      if (req.aborted && err.code !== 'ERR_FR_TOO_MANY_REDIRECTS') return;
      reject(enhanceError(err, config, null, req));
    });

    // set tcp keep alive to prevent drop connection by peer
    req.on('socket', function handleRequestSocket(socket) {
      // default interval of sending ack packet is 1 minute
      socket.setKeepAlive(true, 1000 * 60);
    });

    // Handle request timeout
    if (config.timeout) {
      // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
      var timeout = parseInt(config.timeout, 10);

      if (isNaN(timeout)) {
        reject(createError(
          'error trying to parse `config.timeout` to int',
          config,
          'ERR_PARSE_TIMEOUT',
          req
        ));

        return;
      }

      // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
      // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
      // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
      // And then these socket which be hang up will devouring CPU little by little.
      // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
      req.setTimeout(timeout, function handleRequestTimeout() {
        req.abort();
        var timeoutErrorMessage = '';
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        } else {
          timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
        }
        var transitional = config.transitional || defaults.transitional;
        reject(createError(
          timeoutErrorMessage,
          config,
          transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
          req
        ));
      });
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (req.aborted) return;

        req.abort();
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel);
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }


    // Send the request
    if (utils.isStream(data)) {
      onUploadProgress && captureStreamProgress(data, contentLength, onUploadProgress);

      data.on('error', function handleStreamError(err) {
        reject(enhanceError(err, config, null, req));
      }).pipe(req);
    } else {
      req.end(data);
    }
  });
};
