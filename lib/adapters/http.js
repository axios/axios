import utils from '../utils.js';
import settle from '../core/settle.js';
import buildFullPath from '../core/buildFullPath.js';
import buildURL from '../helpers/buildURL.js';
import { getProxyForUrl } from 'proxy-from-env';
import HttpsProxyAgent from 'https-proxy-agent';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import util from 'util';
import { resolve as resolvePath } from 'path';
import followRedirects from 'follow-redirects';
import zlib from 'zlib';
import { VERSION } from '../env/data.js';
import transitionalDefaults from '../defaults/transitional.js';
import AxiosError from '../core/AxiosError.js';
import CanceledError from '../cancel/CanceledError.js';
import platform from '../platform/index.js';
import fromDataURI from '../helpers/fromDataURI.js';
import stream from 'stream';
import AxiosHeaders from '../core/AxiosHeaders.js';
import AxiosTransformStream from '../helpers/AxiosTransformStream.js';
import { EventEmitter } from 'events';
import formDataToStream from '../helpers/formDataToStream.js';
import readBlob from '../helpers/readBlob.js';
import ZlibHeaderTransformStream from '../helpers/ZlibHeaderTransformStream.js';
import Http2Sessions from '../helpers/Http2Sessions.js';
import callbackify from '../helpers/callbackify.js';
import shouldBypassProxy from '../helpers/shouldBypassProxy.js';
import { toByteStringHeaderObject } from '../helpers/sanitizeHeaderValue.js';
import {
  progressEventReducer,
  progressEventDecorator,
  asyncDecorator,
} from '../helpers/progressEventReducer.js';
import estimateDataURLDecodedBytes from '../helpers/estimateDataURLDecodedBytes.js';

const zlibOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH,
};

const brotliOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
};

const zstdOptions = {
  flush: zlib.constants.ZSTD_e_flush,
  finishFlush: zlib.constants.ZSTD_e_flush,
};

const isBrotliSupported = utils.isFunction(zlib.createBrotliDecompress);
const isZstdSupported = utils.isFunction(zlib.createZstdDecompress);
const ACCEPT_ENCODING = 'gzip, compress, deflate' + (isBrotliSupported ? ', br' : '');
const ACCEPT_ENCODING_WITH_ZSTD = ACCEPT_ENCODING + (isZstdSupported ? ', zstd' : '');

const { http: httpFollow, https: httpsFollow } = followRedirects;

const isHttps = /https:?/;
const FORM_DATA_CONTENT_HEADERS = ['content-type', 'content-length'];

function setFormDataHeaders(headers, formHeaders, policy) {
  if (policy !== 'content-only') {
    headers.set(formHeaders);
    return;
  }

  Object.entries(formHeaders).forEach(([key, val]) => {
    if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });
}

// Symbols used to bind a single 'error' listener to a pooled socket and track
// the request currently owning that socket across keep-alive reuse (issue #10780).
const kAxiosSocketListener = Symbol('axios.http.socketListener');
const kAxiosCurrentReq = Symbol('axios.http.currentReq');

// Tags HttpsProxyAgent instances installed by setProxy() so the redirect path
// can strip them without clobbering a user-supplied agent that happens to be
// an HttpsProxyAgent.
const kAxiosInstalledTunnel = Symbol('axios.http.installedTunnel');

// Cache of CONNECT-tunneling agents keyed by proxy config so repeat requests
// through the same proxy reuse a single agent (and its socket pool). The
// keyspace is bounded by the set of distinct proxy configs the process uses,
// so unbounded growth is not a concern in practice.
const tunnelingAgentCache = new Map();
const tunnelingAgentCacheUser = new WeakMap();
// Minimum minor versions where Node's HTTP Agent supports native proxyEnv
// handling. Checking the selected agent below also covers startup modes such
// as NODE_OPTIONS=--use-env-proxy and --no-use-env-proxy precedence.
const NODE_NATIVE_ENV_PROXY_SUPPORT = {
  22: 21,
  24: 5,
};

function isNodeNativeEnvProxySupported(nodeVersion = process.versions && process.versions.node) {
  if (!nodeVersion) {
    return false;
  }

  const [major, minor] = nodeVersion.split('.').map((part) => Number(part));

  if (!Number.isInteger(major) || !Number.isInteger(minor)) {
    return false;
  }

  if (major > 24) {
    return true;
  }

  return (
    NODE_NATIVE_ENV_PROXY_SUPPORT[major] != null && minor >= NODE_NATIVE_ENV_PROXY_SUPPORT[major]
  );
}

function isNodeEnvProxyEnabled(agent, nodeVersion = process.versions && process.versions.node) {
  if (!isNodeNativeEnvProxySupported(nodeVersion)) {
    return false;
  }

  const agentOptions = agent && agent.options;

  return Boolean(
    agentOptions &&
      utils.hasOwnProp(agentOptions, 'proxyEnv') &&
      agentOptions.proxyEnv != null
  );
}

function getProxyEnvAgent(options, configHttpAgent, configHttpsAgent) {
  return isHttps.test(options.protocol)
    ? (configHttpsAgent || https.globalAgent)
    : (configHttpAgent || http.globalAgent);
}

function getTunnelingAgent(agentOptions, userHttpsAgent) {
  const key =
    agentOptions.protocol +
    '//' +
    agentOptions.hostname +
    ':' +
    (agentOptions.port || '') +
    '#' +
    (agentOptions.auth || '');
  const cache = userHttpsAgent
    ? (tunnelingAgentCacheUser.get(userHttpsAgent) ||
        tunnelingAgentCacheUser.set(userHttpsAgent, new Map()).get(userHttpsAgent))
    : tunnelingAgentCache;
  let agent = cache.get(key);
  if (agent) return agent;
  // Forward the user's TLS options (custom CA, rejectUnauthorized, client cert,
  // etc.) into the tunneling agent so they apply to the origin TLS upgrade
  // performed after CONNECT. Our proxy fields take precedence on conflict.
  const merged = userHttpsAgent && userHttpsAgent.options
    ? { ...userHttpsAgent.options, ...agentOptions }
    : agentOptions;
  agent = new HttpsProxyAgent(merged);
  if (userHttpsAgent && userHttpsAgent.options) {
    const originTLSOptions = { ...userHttpsAgent.options };
    const callback = agent.callback;
    agent.callback = function axiosTunnelingAgentCallback(req, opts) {
      // HttpsProxyAgent v5 reads callback opts for the post-CONNECT origin TLS upgrade.
      return callback.call(this, req, { ...originTLSOptions, ...opts });
    };
  }
  agent[kAxiosInstalledTunnel] = true;
  cache.set(key, agent);
  return agent;
}

const supportedProtocols = platform.protocols.map((protocol) => {
  return protocol + ':';
});

// Node's WHATWG URL parser returns `username` and `password` percent-encoded.
// Decode before composing the `auth` option so credentials such as
// `my%40email.com:pass` are sent as `my@email.com:pass`. Falls back to the
// original value for malformed input so a bad encoding never throws.
const decodeURIComponentSafe = (value) => {
  if (!utils.isString(value)) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

const flushOnFinish = (stream, [throttled, flush]) => {
  stream.on('end', flush).on('error', flush);

  return throttled;
};

const http2Sessions = new Http2Sessions();

/**
 * If the proxy, auth, sensitive header, or config beforeRedirects functions are defined,
 * call them with the options object.
 *
 * @param {Object<string, any>} options - The options object that was passed to the request.
 *
 * @returns {Object<string, any>}
 */
function dispatchBeforeRedirect(options, responseDetails, requestDetails) {
  if (options.beforeRedirects.proxy) {
    options.beforeRedirects.proxy(options);
  }
  if (options.beforeRedirects.auth) {
    options.beforeRedirects.auth(options);
  }
  if (options.beforeRedirects.sensitiveHeaders) {
    options.beforeRedirects.sensitiveHeaders(options, requestDetails);
  }
  if (options.beforeRedirects.config) {
    options.beforeRedirects.config(options, responseDetails, requestDetails);
  }
}

function stripMatchingHeaders(headers, sensitiveSet) {
  if (!headers) {
    return;
  }

  Object.keys(headers).forEach((header) => {
    if (sensitiveSet.has(header.toLowerCase())) {
      delete headers[header];
    }
  });
}

function isSameOriginRedirect(redirectOptions, requestDetails) {
  if (!requestDetails) {
    return false;
  }

  try {
    return new URL(requestDetails.url).origin === new URL(redirectOptions.href).origin;
  } catch (e) {
    // If origin comparison fails, treat the redirect as unsafe.
    return false;
  }
}

/**
 * If the proxy or config afterRedirects functions are defined, call them with the options
 *
 * @param {http.ClientRequestArgs} options
 * @param {AxiosProxyConfig} configProxy configuration from Axios options object
 * @param {string} location
 *
 * @returns {http.ClientRequestArgs}
 */
function setProxy(options, configProxy, location, isRedirect, configHttpsAgent, configHttpAgent) {
  let proxy = configProxy;
  const proxyEnvAgent = getProxyEnvAgent(options, configHttpAgent, configHttpsAgent);
  if (!proxy && proxy !== false && !isNodeEnvProxyEnabled(proxyEnvAgent)) {
    const proxyUrl = getProxyForUrl(location);
    if (proxyUrl) {
      if (!shouldBypassProxy(location)) {
        proxy = new URL(proxyUrl);
      }
    }
  }
  // On redirect re-invocation, strip any stale Proxy-Authorization header carried
  // over from the prior request (e.g. new target no longer uses a proxy, or uses
  // a different proxy). Skip on the initial request so user-supplied headers are
  // preserved. Header names are case-insensitive, so remove every case variant.
  if (isRedirect && options.headers) {
    for (const name of Object.keys(options.headers)) {
      if (name.toLowerCase() === 'proxy-authorization') {
        delete options.headers[name];
      }
    }
  }
  // Strip any tunneling agent we installed for the previous hop so a redirect
  // that drops the proxy or crosses an HTTPS↔HTTP boundary doesn't reuse a
  // stale one. Match on our Symbol marker so a user-supplied HttpsProxyAgent
  // (which won't carry the marker) is left alone.
  if (isRedirect && options.agent && options.agent[kAxiosInstalledTunnel]) {
    options.agent = undefined;
  }
  if (proxy) {
    // Read proxy fields without traversing the prototype chain. URL instances expose
    // username/password/hostname/host/port/protocol via getters on URL.prototype (so
    // direct reads are shielded), but plain object proxies — and the `auth` field
    // (which URL does not expose) — must be guarded so a polluted Object.prototype
    // (e.g. Object.prototype.auth = { username, password }) cannot inject
    // attacker-controlled credentials into the Proxy-Authorization header or
    // redirect proxying to an attacker-controlled host.
    const isProxyURL = proxy instanceof URL;
    const readProxyField = (key) =>
      isProxyURL || utils.hasOwnProp(proxy, key) ? proxy[key] : undefined;

    const proxyUsername = readProxyField('username');
    const proxyPassword = readProxyField('password');
    let proxyAuth = utils.hasOwnProp(proxy, 'auth') ? proxy.auth : undefined;

    // Basic proxy authorization
    if (proxyUsername) {
      proxyAuth = (proxyUsername || '') + ':' + (proxyPassword || '');
    }

    if (proxyAuth) {
      // Support proxy auth object form. Read sub-fields via own-prop checks so a
      // plain object inheriting from polluted Object.prototype cannot leak creds.
      const authIsObject = typeof proxyAuth === 'object';
      const authUsername =
        authIsObject && utils.hasOwnProp(proxyAuth, 'username') ? proxyAuth.username : undefined;
      const authPassword =
        authIsObject && utils.hasOwnProp(proxyAuth, 'password') ? proxyAuth.password : undefined;
      const validProxyAuth = Boolean(authUsername || authPassword);

      if (validProxyAuth) {
        proxyAuth = (authUsername || '') + ':' + (authPassword || '');
      } else if (authIsObject) {
        throw new AxiosError('Invalid proxy authorization', AxiosError.ERR_BAD_OPTION, { proxy });
      }
    }

    const targetIsHttps = isHttps.test(options.protocol);

    if (targetIsHttps) {
      // CONNECT-tunneling path for HTTPS targets. Preserves end-to-end TLS to
      // the origin so the proxy cannot inspect the URL, headers, or body — the
      // behavior already promised by THREATMODEL.md (T-R9). HttpsProxyAgent
      // sends Proxy-Authorization on the CONNECT request only, never on the
      // wrapped TLS request, which is why we don't stamp it onto
      // options.headers here. If the user already supplied an HttpsProxyAgent,
      // they own tunneling end-to-end and we leave them alone; otherwise we
      // install our own tunneling agent and forward their TLS options (if any)
      // so a custom httpsAgent for cert pinning / rejectUnauthorized still
      // applies to the origin TLS upgrade.
      if (!(configHttpsAgent instanceof HttpsProxyAgent)) {
        const proxyHost = readProxyField('hostname') || readProxyField('host');
        const proxyPort = readProxyField('port');
        const rawProxyProtocol = readProxyField('protocol');
        const normalizedProtocol = rawProxyProtocol
          ? rawProxyProtocol.includes(':')
            ? rawProxyProtocol
            : `${rawProxyProtocol}:`
          : 'http:';
        // Bracket IPv6 literals for URL parsing; URL.hostname strips the
        // brackets again on read so the agent receives the raw form.
        const proxyHostForURL =
          proxyHost && proxyHost.includes(':') && !proxyHost.startsWith('[')
            ? `[${proxyHost}]`
            : proxyHost;
        const proxyURL = new URL(
          `${normalizedProtocol}//${proxyHostForURL}${proxyPort ? ':' + proxyPort : ''}`
        );
        const agentOptions = {
          protocol: proxyURL.protocol,
          hostname: proxyURL.hostname.replace(/^\[|\]$/g, ''),
          port: proxyURL.port,
          auth: proxyAuth && typeof proxyAuth === 'string' ? proxyAuth : undefined,
        };
        if (proxyURL.protocol === 'https:') {
          agentOptions.ALPNProtocols = ['http/1.1'];
        }
        const tunnelingAgent = getTunnelingAgent(agentOptions, configHttpsAgent);
        // Set both: `options.agent` is consumed by the native https.request path
        // (maxRedirects === 0); `options.agents.https` is consumed by
        // follow-redirects, which ignores `options.agent` when `options.agents`
        // is present.
        options.agent = tunnelingAgent;
        if (options.agents) {
          options.agents.https = tunnelingAgent;
        }
      }
    } else {
      // Forward-proxy mode for plaintext HTTP targets. The request line carries
      // the absolute URL and the proxy sees everything — acceptable for plain
      // HTTP since the wire was already plaintext.
      if (proxyAuth) {
        const base64 = Buffer.from(proxyAuth, 'utf8').toString('base64');
        options.headers['Proxy-Authorization'] = 'Basic ' + base64;
      }

      // Preserve a user-supplied Host header (case-insensitive) so callers can override
      // the value forwarded to the proxy; otherwise default to the request URL's host.
      let hasUserHostHeader = false;
      for (const name of Object.keys(options.headers)) {
        if (name.toLowerCase() === 'host') {
          hasUserHostHeader = true;
          break;
        }
      }
      if (!hasUserHostHeader) {
        options.headers.host = options.hostname + (options.port ? ':' + options.port : '');
      }
      const proxyHost = readProxyField('hostname') || readProxyField('host');
      options.hostname = proxyHost;
      // Replace 'host' since options is not a URL object
      options.host = proxyHost;
      options.port = readProxyField('port');
      options.path = location;
      const proxyProtocol = readProxyField('protocol');
      if (proxyProtocol) {
        options.protocol = proxyProtocol.includes(':') ? proxyProtocol : `${proxyProtocol}:`;
      }
    }
  }

  options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
    // Configure proxy for redirected request, passing the original config proxy to apply
    // the exact same logic as if the redirected request was performed by axios directly.
    setProxy(
      redirectOptions,
      configProxy,
      redirectOptions.href,
      true,
      configHttpsAgent,
      configHttpAgent
    );
  };
}

const isHttpAdapterSupported =
  typeof process !== 'undefined' && utils.kindOf(process) === 'process';

// temporary hotfix

const wrapAsync = (asyncExecutor) => {
  return new Promise((resolve, reject) => {
    let onDone;
    let isDone;

    const done = (value, isRejected) => {
      if (isDone) return;
      isDone = true;
      onDone && onDone(value, isRejected);
    };

    const _resolve = (value) => {
      done(value);
      resolve(value);
    };

    const _reject = (reason) => {
      done(reason, true);
      reject(reason);
    };

    asyncExecutor(_resolve, _reject, (onDoneHandler) => (onDone = onDoneHandler)).catch(_reject);
  });
};

const resolveFamily = ({ address, family }) => {
  if (!utils.isString(address)) {
    throw TypeError('address must be a string');
  }
  return {
    address,
    family: family || (address.indexOf('.') < 0 ? 6 : 4),
  };
};

const buildAddressEntry = (address, family) =>
  resolveFamily(utils.isObject(address) ? address : { address, family });

const http2Transport = {
  request(options, cb) {
    const authority =
      options.protocol +
      '//' +
      options.hostname +
      ':' +
      (options.port || (options.protocol === 'https:' ? 443 : 80));

    const { http2Options, headers } = options;

    const session = http2Sessions.getSession(authority, http2Options);

    const { HTTP2_HEADER_SCHEME, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS } =
      http2.constants;

    const http2Headers = {
      [HTTP2_HEADER_SCHEME]: options.protocol.replace(':', ''),
      [HTTP2_HEADER_METHOD]: options.method,
      [HTTP2_HEADER_PATH]: options.path,
    };

    utils.forEach(headers, (header, name) => {
      name.charAt(0) !== ':' && (http2Headers[name] = header);
    });

    const req = session.request(http2Headers);

    req.once('response', (responseHeaders) => {
      const response = req; //duplex

      responseHeaders = Object.assign({}, responseHeaders);

      const status = responseHeaders[HTTP2_HEADER_STATUS];

      delete responseHeaders[HTTP2_HEADER_STATUS];

      response.headers = responseHeaders;

      response.statusCode = +status;

      cb(response);
    });

    return req;
  },
};

/*eslint consistent-return:0*/
export default isHttpAdapterSupported &&
  function httpAdapter(config) {
    return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
      // Read config pollution-safely: own properties and members inherited from
      // a non-Object.prototype source (e.g. an Object.create(defaults) template)
      // are honored, but values injected onto a polluted Object.prototype are
      // ignored. All behavior-affecting reads in this adapter go through own()
      // so the protection boundary stays consistent.
      const own = (key) => utils.getSafeProp(config, key);
      const transitional = own('transitional') || transitionalDefaults;
      let data = own('data');
      let lookup = own('lookup');
      let family = own('family');
      let httpVersion = own('httpVersion');
      if (httpVersion === undefined) httpVersion = 1;
      let http2Options = own('http2Options');
      const httpAgent = own('httpAgent');
      const httpsAgent = own('httpsAgent');
      const configProxy = own('proxy');
      const responseType = own('responseType');
      const responseEncoding = own('responseEncoding');
      const socketPath = own('socketPath');
      const method = own('method').toUpperCase();
      const maxRedirects = own('maxRedirects');
      const maxBodyLength = own('maxBodyLength');
      const maxContentLength = own('maxContentLength');
      const decompress = own('decompress');
      let isDone;
      let rejected = false;
      let req;
      let connectPhaseTimer;

      httpVersion = +httpVersion;

      if (Number.isNaN(httpVersion)) {
        throw TypeError(`Invalid protocol version: '${config.httpVersion}' is not a number`);
      }

      if (httpVersion !== 1 && httpVersion !== 2) {
        throw TypeError(`Unsupported protocol version '${httpVersion}'`);
      }

      const isHttp2 = httpVersion === 2;

      if (lookup) {
        const _lookup = callbackify(lookup, (value) => (utils.isArray(value) ? value : [value]));
        // hotfix to support opt.all option which is required for node 20.x
        lookup = (hostname, opt, cb) => {
          _lookup(hostname, opt, (err, arg0, arg1) => {
            if (err) {
              return cb(err);
            }

            const addresses = utils.isArray(arg0)
              ? arg0.map((addr) => buildAddressEntry(addr))
              : [buildAddressEntry(arg0, arg1)];

            opt.all ? cb(err, addresses) : cb(err, addresses[0].address, addresses[0].family);
          });
        };
      }

      const abortEmitter = new EventEmitter();

      function abort(reason) {
        try {
          abortEmitter.emit(
            'abort',
            !reason || reason.type ? new CanceledError(null, config, req) : reason
          );
        } catch (err) {
          // ignore emit errors
        }
      }

      function clearConnectPhaseTimer() {
        if (connectPhaseTimer) {
          clearTimeout(connectPhaseTimer);
          connectPhaseTimer = null;
        }
      }

      function createTimeoutError() {
        const configTimeout = own('timeout');
        let timeoutErrorMessage = configTimeout
          ? 'timeout of ' + configTimeout + 'ms exceeded'
          : 'timeout exceeded';
        const configTimeoutErrorMessage = own('timeoutErrorMessage');
        if (configTimeoutErrorMessage) {
          timeoutErrorMessage = configTimeoutErrorMessage;
        }
        return new AxiosError(
          timeoutErrorMessage,
          transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config,
          req
        );
      }

      abortEmitter.once('abort', reject);

      const onFinished = () => {
        clearConnectPhaseTimer();

        if (config.cancelToken) {
          config.cancelToken.unsubscribe(abort);
        }

        if (config.signal) {
          config.signal.removeEventListener('abort', abort);
        }

        abortEmitter.removeAllListeners();
      };

      if (config.cancelToken || config.signal) {
        config.cancelToken && config.cancelToken.subscribe(abort);
        if (config.signal) {
          config.signal.aborted ? abort() : config.signal.addEventListener('abort', abort);
        }
      }

      onDone((response, isRejected) => {
        isDone = true;
        clearConnectPhaseTimer();

        if (isRejected) {
          rejected = true;
          onFinished();
          return;
        }

        const { data } = response;

        if (data instanceof stream.Readable || data instanceof stream.Duplex) {
          const offListeners = stream.finished(data, () => {
            offListeners();
            onFinished();
          });
        } else {
          onFinished();
        }
      });

      // Parse url
      const fullPath = buildFullPath(own('baseURL'), own('url'), own('allowAbsoluteUrls'), config);
      // Unix-socket requests (own socketPath) commonly pass a path-only url
      // like '/foo'; supply a synthetic base so new URL() can still parse it.
      // Use the own-property value (not config.socketPath) so a polluted
      // prototype cannot influence URL base selection.
      const urlBase = socketPath
        ? 'http://localhost'
        : (platform.hasBrowserEnv ? platform.origin : undefined);
      const parsed = new URL(fullPath, urlBase);
      const protocol = parsed.protocol || supportedProtocols[0];

      if (protocol === 'data:') {
        // Apply the same semantics as HTTP: only enforce if a finite, non-negative cap is set.
        if (maxContentLength > -1) {
          // Use the exact string passed to fromDataURI (the configured url); fall back to fullPath if needed.
          const dataUrl = String(own('url') || fullPath || '');
          const estimated = estimateDataURLDecodedBytes(dataUrl);

          if (estimated > maxContentLength) {
            return reject(
              new AxiosError(
                'maxContentLength size of ' + maxContentLength + ' exceeded',
                AxiosError.ERR_BAD_RESPONSE,
                config
              )
            );
          }
        }

        let convertedData;

        if (method !== 'GET') {
          return settle(resolve, reject, {
            status: 405,
            statusText: 'method not allowed',
            headers: {},
            config,
          });
        }

        try {
          convertedData = fromDataURI(own('url'), responseType === 'blob', {
            Blob: config.env && config.env.Blob,
          });
        } catch (err) {
          throw AxiosError.from(err, AxiosError.ERR_BAD_REQUEST, config);
        }

        if (responseType === 'text') {
          convertedData = convertedData.toString(responseEncoding);

          if (!responseEncoding || responseEncoding === 'utf8') {
            convertedData = utils.stripBOM(convertedData);
          }
        } else if (responseType === 'stream') {
          convertedData = stream.Readable.from(convertedData);
        }

        return settle(resolve, reject, {
          data: convertedData,
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
        });
      }

      if (supportedProtocols.indexOf(protocol) === -1) {
        return reject(
          new AxiosError('Unsupported protocol ' + protocol, AxiosError.ERR_BAD_REQUEST, config)
        );
      }

      const headers = AxiosHeaders.from(config.headers).normalize();

      // Set User-Agent (required by some servers)
      // See https://github.com/axios/axios/issues/69
      // User-Agent is specified; handle case where no UA header is desired
      // Only set header if it hasn't been set in config
      headers.set('User-Agent', 'axios/' + VERSION, false);

      const { onUploadProgress, onDownloadProgress } = config;
      const maxRate = config.maxRate;
      let maxUploadRate = undefined;
      let maxDownloadRate = undefined;

      // support for spec compliant FormData objects
      if (utils.isSpecCompliantForm(data)) {
        const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);

        data = formDataToStream(
          data,
          (formHeaders) => {
            headers.set(formHeaders);
          },
          {
            tag: `axios-${VERSION}-boundary`,
            boundary: (userBoundary && userBoundary[1]) || undefined,
          }
        );
        // support for https://www.npmjs.com/package/form-data api
      } else if (
        utils.isFormData(data) &&
        utils.isFunction(data.getHeaders) &&
        data.getHeaders !== Object.prototype.getHeaders
      ) {
        setFormDataHeaders(headers, data.getHeaders(), own('formDataHeaderPolicy'));

        if (!headers.hasContentLength()) {
          try {
            const knownLength = await util.promisify(data.getLength).call(data);
            Number.isFinite(knownLength) &&
              knownLength >= 0 &&
              headers.setContentLength(knownLength);
            /*eslint no-empty:0*/
          } catch (e) {}
        }
      } else if (utils.isBlob(data) || utils.isFile(data)) {
        data.size && headers.setContentType(data.type || 'application/octet-stream');
        headers.setContentLength(data.size || 0);
        data = stream.Readable.from(readBlob(data));
      } else if (data && !utils.isStream(data)) {
        if (Buffer.isBuffer(data)) {
          // Nothing to do...
        } else if (utils.isArrayBuffer(data)) {
          data = Buffer.from(new Uint8Array(data));
        } else if (utils.isString(data)) {
          data = Buffer.from(data, 'utf-8');
        } else {
          return reject(
            new AxiosError(
              'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
              AxiosError.ERR_BAD_REQUEST,
              config
            )
          );
        }

        // Add Content-Length header if data exists
        headers.setContentLength(data.length, false);

        if (maxBodyLength > -1 && data.length > maxBodyLength) {
          return reject(
            new AxiosError(
              'Request body larger than maxBodyLength limit',
              AxiosError.ERR_BAD_REQUEST,
              config
            )
          );
        }
      }

      const contentLength = utils.toFiniteNumber(headers.getContentLength());

      if (utils.isArray(maxRate)) {
        maxUploadRate = maxRate[0];
        maxDownloadRate = maxRate[1];
      } else {
        maxUploadRate = maxDownloadRate = maxRate;
      }

      if (data && (onUploadProgress || maxUploadRate)) {
        if (!utils.isStream(data)) {
          data = stream.Readable.from(data, { objectMode: false });
        }

        data = stream.pipeline(
          [
            data,
            new AxiosTransformStream({
              maxRate: utils.toFiniteNumber(maxUploadRate),
            }),
          ],
          utils.noop
        );

        onUploadProgress &&
          data.on(
            'progress',
            flushOnFinish(
              data,
              progressEventDecorator(
                contentLength,
                progressEventReducer(asyncDecorator(onUploadProgress), false, 3)
              )
            )
          );
      }

      // HTTP basic authentication
      let auth = undefined;
      const configAuth = own('auth');
      if (configAuth) {
        const username = utils.getSafeProp(configAuth, 'username') || '';
        const password = utils.getSafeProp(configAuth, 'password') || '';
        auth = username + ':' + password;
      }

      if (!auth && (parsed.username || parsed.password)) {
        const urlUsername = decodeURIComponentSafe(parsed.username);
        const urlPassword = decodeURIComponentSafe(parsed.password);
        auth = urlUsername + ':' + urlPassword;
      }

      auth && headers.delete('authorization');

      let path;

      try {
        path = buildURL(
          parsed.pathname + parsed.search,
          own('params'),
          own('paramsSerializer')
        ).replace(/^\?/, '');
      } catch (err) {
        return reject(
          AxiosError.from(err, AxiosError.ERR_BAD_REQUEST, config, null, null, {
            url: own('url'),
            exists: true
          })
        );
      }

      headers.set(
        'Accept-Encoding',
        utils.hasOwnProp(transitional, 'advertiseZstdAcceptEncoding') &&
        transitional.advertiseZstdAcceptEncoding === true ? ACCEPT_ENCODING_WITH_ZSTD : ACCEPT_ENCODING,
        false
      );

      // Null-prototype to block prototype pollution gadgets on properties read
      // directly by Node's http.request (e.g. insecureHTTPParser, lookup).
      const options = Object.assign(Object.create(null), {
        path,
        method: method,
        headers: toByteStringHeaderObject(headers),
        agents: { http: httpAgent, https: httpsAgent },
        auth,
        protocol,
        family,
        beforeRedirect: dispatchBeforeRedirect,
        beforeRedirects: Object.create(null),
        http2Options,
      });

      // cacheable-lookup integration hotfix
      !utils.isUndefined(lookup) && (options.lookup = lookup);

      if (socketPath) {
        if (typeof socketPath !== 'string') {
          return reject(
            new AxiosError('socketPath must be a string', AxiosError.ERR_BAD_OPTION_VALUE, config)
          );
        }

        const allowedSocketPaths = own('allowedSocketPaths');
        if (allowedSocketPaths != null) {
          const allowed = Array.isArray(allowedSocketPaths)
            ? allowedSocketPaths
            : [allowedSocketPaths];

          const resolvedSocket = resolvePath(socketPath);
          const isAllowed = allowed.some(
            (entry) => typeof entry === 'string' && resolvePath(entry) === resolvedSocket
          );

          if (!isAllowed) {
            return reject(
              new AxiosError(
                `socketPath "${socketPath}" is not permitted by allowedSocketPaths`,
                AxiosError.ERR_BAD_OPTION_VALUE,
                config
              )
            );
          }
        }

        options.socketPath = socketPath;
      } else {
        options.hostname = parsed.hostname.startsWith('[')
          ? parsed.hostname.slice(1, -1)
          : parsed.hostname;
        options.port = parsed.port;
        setProxy(
          options,
          configProxy,
          protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path,
          false,
          httpsAgent,
          httpAgent
        );
      }
      let transport;
      let isNativeTransport = false;
      // True only for the follow-redirects transport, which applies
      // options.maxBodyLength itself. Every other transport (http2, native
      // http/https, a user-supplied custom transport) needs the explicit
      // byte-counting pipeline below to enforce maxBodyLength on streamed uploads.
      let transportEnforcesMaxBodyLength = false;
      const isHttpsRequest = isHttps.test(options.protocol);
      // Don't clobber a CONNECT-tunneling agent installed by setProxy() for an
      // HTTPS target.
      if (options.agent == null) {
        options.agent = isHttpsRequest ? httpsAgent : httpAgent;
      }

      if (isHttp2) {
        transport = http2Transport;
      } else {
        const configTransport = own('transport');
        if (configTransport) {
          transport = configTransport;
        } else if (maxRedirects === 0) {
          transport = isHttpsRequest ? https : http;
          isNativeTransport = true;
        } else {
          transportEnforcesMaxBodyLength = true;
          options.sensitiveHeaders = [];
          if (maxRedirects) {
            options.maxRedirects = maxRedirects;
          }
          const configBeforeRedirect = own('beforeRedirect');
          if (configBeforeRedirect) {
            options.beforeRedirects.config = configBeforeRedirect;
          }
          if (auth) {
            // Restore HTTP Basic credentials on same-origin redirects only.
            // follow-redirects >= 1.15.8 strips Authorization on every redirect (see #6929);
            // cross-origin stripping is the documented mitigation for T-R2 in THREATMODEL.md
            // and is preserved by deliberately not restoring on origin change.
            const requestOrigin = parsed.origin;
            const authToRestore = auth;
            options.beforeRedirects.auth = function beforeRedirectAuth(redirectOptions) {
              try {
                if (new URL(redirectOptions.href).origin === requestOrigin) {
                  redirectOptions.auth = authToRestore;
                }
              } catch (e) {
                // ignore malformed URL: leaving auth stripped is fail-safe
              }
            };
          }
          const sensitiveHeaders = own('sensitiveHeaders');
          if (sensitiveHeaders != null) {
            if (!utils.isArray(sensitiveHeaders)) {
              return reject(
                new AxiosError(
                  'sensitiveHeaders must be an array of strings',
                  AxiosError.ERR_BAD_OPTION_VALUE,
                  config
                )
              );
            }

            const sensitiveSet = new Set();
            for (const header of sensitiveHeaders) {
              if (!utils.isString(header)) {
                return reject(
                  new AxiosError(
                    'sensitiveHeaders must be an array of strings',
                    AxiosError.ERR_BAD_OPTION_VALUE,
                    config
                  )
                );
              }

              sensitiveSet.add(header.toLowerCase());
            }

            if (sensitiveSet.size) {
              options.sensitiveHeaders = Array.from(sensitiveSet);
              options.beforeRedirects.sensitiveHeaders = function beforeRedirectSensitiveHeaders(
                redirectOptions,
                requestDetails
              ) {
                if (!isSameOriginRedirect(redirectOptions, requestDetails)) {
                  stripMatchingHeaders(redirectOptions.headers, sensitiveSet);
                }
              };
            }
          }
          transport = isHttpsRequest ? httpsFollow : httpFollow;
        }
      }

      // Set an explicit maxBodyLength option for transports that inspect it.
      // When maxBodyLength is -1 (default/unlimited), use Infinity so
      // follow-redirects does not fall back to its own 10MB default.
      if (maxBodyLength > -1) {
        options.maxBodyLength = maxBodyLength;
      } else {
        options.maxBodyLength = Infinity;
      }

      // Always set an explicit own value so a polluted
      // Object.prototype.insecureHTTPParser cannot enable the lenient parser
      // through Node's internal options copy
      options.insecureHTTPParser = Boolean(own('insecureHTTPParser'));

      // Create the request
      req = transport.request(options, function handleResponse(res) {
        clearConnectPhaseTimer();

        if (req.destroyed) return;

        const streams = [res];

        const responseLength = utils.toFiniteNumber(res.headers['content-length']);

        if (onDownloadProgress || maxDownloadRate) {
          const transformStream = new AxiosTransformStream({
            maxRate: utils.toFiniteNumber(maxDownloadRate),
          });

          onDownloadProgress &&
            transformStream.on(
              'progress',
              flushOnFinish(
                transformStream,
                progressEventDecorator(
                  responseLength,
                  progressEventReducer(asyncDecorator(onDownloadProgress), true, 3)
                )
              )
            );

          streams.push(transformStream);
        }

        // decompress the response body transparently if required
        let responseStream = res;

        // return the last request in case of redirects
        const lastRequest = res.req || req;

        // if decompress disabled we should not decompress
        if (decompress !== false && res.headers['content-encoding']) {
          // if no content, but headers still say that it is encoded,
          // remove the header not confuse downstream operations
          if (method === 'HEAD' || res.statusCode === 204) {
            delete res.headers['content-encoding'];
          }

          switch ((res.headers['content-encoding'] || '').toLowerCase()) {
            /*eslint default-case:0*/
            case 'gzip':
            case 'x-gzip':
            case 'compress':
            case 'x-compress':
              // add the unzipper to the body stream processing pipeline
              streams.push(zlib.createUnzip(zlibOptions));

              // remove the content-encoding in order to not confuse downstream operations
              delete res.headers['content-encoding'];
              break;
            case 'deflate':
              streams.push(new ZlibHeaderTransformStream());

              // add the unzipper to the body stream processing pipeline
              streams.push(zlib.createUnzip(zlibOptions));

              // remove the content-encoding in order to not confuse downstream operations
              delete res.headers['content-encoding'];
              break;
            case 'br':
              if (isBrotliSupported) {
                streams.push(zlib.createBrotliDecompress(brotliOptions));
                delete res.headers['content-encoding'];
              }
              break;
            case 'zstd':
              if (isZstdSupported) {
                streams.push(zlib.createZstdDecompress(zstdOptions));
                delete res.headers['content-encoding'];
              }
              break;
          }
        }

        responseStream = streams.length > 1 ? stream.pipeline(streams, utils.noop) : streams[0];

        const response = {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: new AxiosHeaders(res.headers),
          config,
          request: lastRequest,
        };

        if (responseType === 'stream') {
          // Enforce maxContentLength on streamed responses; previously this
          // was applied only to buffered responses.
          if (maxContentLength > -1) {
            const limit = maxContentLength;
            const source = responseStream;
            async function* enforceMaxContentLength() {
              let totalResponseBytes = 0;
              for await (const chunk of source) {
                totalResponseBytes += chunk.length;
                if (totalResponseBytes > limit) {
                  throw new AxiosError(
                    'maxContentLength size of ' + limit + ' exceeded',
                    AxiosError.ERR_BAD_RESPONSE,
                    config,
                    lastRequest
                  );
                }
                yield chunk;
              }
            }
            responseStream = stream.Readable.from(enforceMaxContentLength(), {
              objectMode: false,
            });
          }
          response.data = responseStream;
          settle(resolve, reject, response);
        } else {
          const responseBuffer = [];
          let totalResponseBytes = 0;

          responseStream.on('data', function handleStreamData(chunk) {
            responseBuffer.push(chunk);
            totalResponseBytes += chunk.length;

            // make sure the content length is not over the maxContentLength if specified
            if (maxContentLength > -1 && totalResponseBytes > maxContentLength) {
              // stream.destroy() emit aborted event before calling reject() on Node.js v16
              rejected = true;
              responseStream.destroy();
              abort(
                new AxiosError(
                  'maxContentLength size of ' + maxContentLength + ' exceeded',
                  AxiosError.ERR_BAD_RESPONSE,
                  config,
                  lastRequest
                )
              );
            }
          });

          responseStream.on('aborted', function handlerStreamAborted() {
            if (rejected) {
              return;
            }

            const err = new AxiosError(
              'stream has been aborted',
              AxiosError.ERR_BAD_RESPONSE,
              config,
              lastRequest,
              response
            );
            responseStream.destroy(err);
            reject(err);
          });

          responseStream.on('error', function handleStreamError(err) {
            if (rejected) return;
            reject(AxiosError.from(err, null, config, lastRequest, response));
          });

          responseStream.on('end', function handleStreamEnd() {
            try {
              let responseData =
                responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
              if (responseType !== 'arraybuffer') {
                responseData = responseData.toString(responseEncoding);
                if (!responseEncoding || responseEncoding === 'utf8') {
                  responseData = utils.stripBOM(responseData);
                }
              }
              response.data = responseData;
            } catch (err) {
              return reject(AxiosError.from(err, null, config, response.request, response));
            }
            settle(resolve, reject, response);
          });
        }

        abortEmitter.once('abort', (err) => {
          if (!responseStream.destroyed) {
            responseStream.emit('error', err);
            responseStream.destroy();
          }
        });
      });

      abortEmitter.once('abort', (err) => {
        if (req.close) {
          req.close();
        } else {
          req.destroy(err);
        }
      });

      // Handle errors
      req.on('error', function handleRequestError(err) {
        reject(AxiosError.from(err, null, config, req));
      });

      // set tcp keep alive to prevent drop connection by peer
      // Track every socket bound to this outer RedirectableRequest so a single
      // 'close' listener can release ownership on all of them. follow-redirects
      // re-emits the 'socket' event for each hop's native request onto the same
      // outer request, so attaching per-request listeners inside this handler
      // would accumulate across hops and trigger MaxListenersExceededWarning at
      // >= 11 redirects. Clearing only the last-bound socket would leave stale
      // kAxiosCurrentReq refs on earlier hop sockets returned to the keep-alive
      // pool, causing an idle-pool 'error' to be attributed to a closed req.
      const boundSockets = new Set();

      req.on('socket', function handleRequestSocket(socket) {
        // default interval of sending ack packet is 1 minute
        // proxy agents (e.g. agent-base) may return a generic Duplex stream
        // that doesn't have setKeepAlive, so guard before calling
        if (typeof socket.setKeepAlive === 'function') {
          socket.setKeepAlive(true, 1000 * 60);
        }

        // Install a single 'error' listener per socket (not per request) to avoid
        // accumulating listeners on pooled keep-alive sockets that get reassigned
        // to new requests before the previous request's 'close' fires (issue #10780).
        // The listener is bound to the socket's currently-active request via a
        // symbol, which is swapped as the socket is reassigned.
        if (!socket[kAxiosSocketListener]) {
          socket.on('error', function handleSocketError(err) {
            const current = socket[kAxiosCurrentReq];
            if (current && !current.destroyed) {
              current.destroy(err);
            }
          });
          socket[kAxiosSocketListener] = true;
        }

        socket[kAxiosCurrentReq] = req;
        boundSockets.add(socket);
      });

      req.once('close', function clearCurrentReq() {
        clearConnectPhaseTimer();

        for (const socket of boundSockets) {
          if (socket[kAxiosCurrentReq] === req) {
            socket[kAxiosCurrentReq] = null;
          }
        }
        boundSockets.clear();
      });

      // Handle request timeout
      if (own('timeout')) {
        // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
        const timeout = parseInt(own('timeout'), 10);

        if (Number.isNaN(timeout)) {
          abort(
            new AxiosError(
              'error trying to parse `config.timeout` to int',
              AxiosError.ERR_BAD_OPTION_VALUE,
              config,
              req
            )
          );

          return;
        }

        const handleTimeout = function handleTimeout() {
          if (isDone) return;
          abort(createTimeoutError());
        };

        if (isNativeTransport && timeout > 0) {
          // Native ClientRequest#setTimeout starts from the socket lifecycle and
          // may not fire while TCP connect is still pending. Mirror the
          // follow-redirects wall-clock timer for the maxRedirects === 0 path.
          connectPhaseTimer = setTimeout(handleTimeout, timeout);
        }

        // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
        // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
        // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
        // And then these socket which be hang up will devouring CPU little by little.
        // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
        req.setTimeout(timeout, handleTimeout);
      } else {
        // explicitly reset the socket timeout value for a possible `keep-alive` request
        req.setTimeout(0);
      }

      // Send the request
      if (utils.isStream(data)) {
        let ended = false;
        let errored = false;

        data.on('end', () => {
          ended = true;
        });

        data.once('error', (err) => {
          errored = true;
          req.destroy(err);
        });

        data.on('close', () => {
          if (!ended && !errored) {
            abort(new CanceledError('Request stream has been aborted', config, req));
          }
        });

        // Enforce maxBodyLength for streamed uploads on every transport that
        // does not apply options.maxBodyLength itself (native http/https, http2,
        // and user-supplied custom transports). The follow-redirects transport
        // enforces it on the redirected HTTP/1 path.
        let uploadStream = data;
        if (maxBodyLength > -1 && !transportEnforcesMaxBodyLength) {
          const limit = maxBodyLength;
          let bytesSent = 0;
          uploadStream = stream.pipeline(
            [
              data,
              new stream.Transform({
                transform(chunk, _enc, cb) {
                  bytesSent += chunk.length;
                  if (bytesSent > limit) {
                    return cb(
                      new AxiosError(
                        'Request body larger than maxBodyLength limit',
                        AxiosError.ERR_BAD_REQUEST,
                        config,
                        req
                      )
                    );
                  }
                  cb(null, chunk);
                },
              }),
            ],
            utils.noop
          );
          uploadStream.on('error', (err) => {
            if (!req.destroyed) req.destroy(err);
          });
        }

        uploadStream.pipe(req);
      } else {
        data && req.write(data);
        req.end();
      }
    });
  };

export const __setProxy = setProxy;
export const __isNodeEnvProxyEnabled = isNodeEnvProxyEnabled;
export const __isSameOriginRedirect = isSameOriginRedirect;
