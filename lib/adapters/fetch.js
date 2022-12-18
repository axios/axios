'use strict';

import utils from './../utils.js';
import platform from '../platform/index.js';
import settle from './../core/settle.js';
import AxiosError from '../core/AxiosError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import buildFullPath from '../core/buildFullPath.js';
import CanceledError from '../cancel/CanceledError.js';
import parseProtocol from '../helpers/parseProtocol.js';
import AbortController from '#abortController';

import fetch, {
  Headers as FetchHeaders,
  Request as FetchRequest,
  Response as FetchResponse,
} from '#fetchApi';

const defaultFetchResponseType = 'json';

const fetchAssertions = true;
const fetchDebugLogging = true;

export {
  fetch,
  FetchHeaders,
  FetchRequest,
  FetchResponse,
}

const textLikeContentTypes = new Set([
    'text/plain',
    'text/html',
    'text/xml',
    'text/css',
    'application/xml',
    'application/xhtml+xml',
]);

const debugLog = (msg, ...args) => {
  if (fetchDebugLogging) {
    console.log('[axios:fetch] ', msg, ...args);
  }
};

const fetchAssert = (definition) => {
    if (fetchAssertions) {
      definition((condition, message) => {
        console.assert(condition, message)
      });
    }
}

function patchDecodeJson(response) {
  response.json = async () => {
    return JSON.parse((await response.text()).trim());
  };
  return response;
}

function dispatchFetch(config, resolve, reject) {
  debugLog('invoked');

  const abortController = new AbortController();
  const { signal } = abortController;
  const body = config.data;
  const method = config.method.toUpperCase();
  const responseType = config.responseType;
  const requestHeaders = AxiosHeaders.from(config.headers).normalize();
  let fullPath = buildFullPath(config.baseURL, config.url);

  // safely parse into `URL`, or use existing/cached URL via config
  let parsedUrl = config.parsedUrl;
  if (!parsedUrl) {
    try {
      // we are unable to parse the URL if it (1) is a relative URL, or (2) is a malformed URL to begin with. to avoid
      // #1 causing an error, we can make an attempt here to use the current window origin as a relative base; this will
      // only work in browsers, though, so we need to be careful to check that we have an origin in the first place.
      if (fullPath.startsWith('/') && platform.isStandardBrowserEnv) {
        // origin = `https://domain.com` (protocol + host + port if non-standard)
        // fullPath = `/foo/bar` (relative path)
        // `fullPath = https://domain.com/foo/bar`
        fullPath = window.location.origin + fullPath;
      }
      parsedUrl = new URL(fullPath);
    } catch (urlParseErr) {
      if (fetchDebugLogging)
        console.error('[axios:fetch] URL parse error: ', urlParseErr);
      reject(urlParseErr);
      return;
    }
  }

  const fetchOptions = config.fetchOptions || {};

  // bail early if protocol is unsupported
  const protocol = parseProtocol(fullPath);
  if (protocol && platform.protocols.indexOf(protocol) === -1) {
    reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
    return;
  }

  // if we're posting form data, let the browser control the content type
  if (utils.isFormData(body) && platform.isStandardBrowserEnv) {
    requestHeaders.setContentType(false);
  }

  // HTTP basic authentication
  if (config.auth) {
    const username = config.auth.username || '';
    const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
    requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
  }

  // honor XHR `withCredentials` as fetch `mode:cors`
  if (!utils.isUndefined(config.withCredentials)) {
    fetchOptions.mode = 'cors';
  }

  let req;
  let fetchHandle;
  let onCanceled;
  if (config.cancelToken || config.signal) {
    // eslint-disable-next-line func-names
    onCanceled = cancel => {
      if (!fetchHandle) {
        // already canceled
        return;
      }
      reject(!cancel || cancel.type ? new CanceledError(null, config, req) : cancel);
      abortController.abort();
      fetchHandle = null;
    };

    config.cancelToken && config.cancelToken.subscribe(onCanceled);
    if (config.signal) {
      config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
    }
  }

  // prep request headers
  const headers = new FetchHeaders();
  utils.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
    headers.set(key, val);
  });

  debugLog('headers', JSON.stringify(headers));

  // body-less requests should not have content-type or content-length headers
  body === undefined && (
      headers.delete('Content-Type') ||
      headers.delete('Content-Length')
  );

  if (fetchDebugLogging) {
    debugLog(`request: ${method} ${parsedUrl.toString()} (has body: ${!!body})`);
  }

  // prep HTTP request
  req = new FetchRequest(parsedUrl, {
    method,
    headers,
    body,
  });

  // mount responseType to request if it is not the default
  if (responseType && responseType !== defaultFetchResponseType) {
    req.responseType = config.responseType;
  }

  // @TODO(sgammon): upload/download progress events

  function done() {
    if (config.cancelToken && onCanceled) {
      config.cancelToken.unsubscribe(onCanceled);
    }
    if (config.signal && onCanceled) {
      config.signal.removeEventListener('abort', onCanceled);
    }
  }

  const cleanup = () => {
    debugLog('cleanup');
    fetchHandle = null;
  };

  const continueChain = (response) => {
    settle(function _resolve(value) {
      resolve(value);
      done();
    }, function _reject(err) {
      reject(err);
      done();
    }, response);
  };

  // success handler: translates a `Response` to an axios response
  const handleResponse = response => {
    if (!fetchHandle) {
      if (fetchDebugLogging) {
        debugLog('fetch cancelled; dropping response');
      }
      return;  // canceled
    }

    // begin preparing the response
    const responseHeaders = AxiosHeaders.from(
        Object.fromEntries(response.headers.entries())
    );
    if (fetchDebugLogging) {
      debugLog('headers', responseHeaders);
    }

    let handler = null;
    const handlers = {
      'text': response.text,
      'form': response.formData,
      'blob': response.blob,
      'json': () => patchDecodeJson(response).json(),
    };

    const selectHandlerFromConfig = () => {
      handler = handlers[config.responseType] || null;
    };

    const selectHandlerFromContentType = (contentType) => {
      const resolvedContentType = (
          // if it's a text-like content type, resolve it as text/plain
          textLikeContentTypes.has(contentType) ? 'text/plain' : contentType
      );
      handler = {
        'application/json': handlers['json'],
        'text/plain': handlers['text'],
      }[resolvedContentType] || null;
    };

    if (responseHeaders.has('Content-Type') && responseHeaders.has('Content-Length')) {
      const contentType = responseHeaders.get('Content-Type');
      const length = +(responseHeaders.get('Content-Length') || 0);
      if (length > 0) {
        // if we have a content-length and content-type, it means we have a body. select a handler to consume the body
        // based on config, or fall-back to the content-type to resolve a value. if all else fails, the data is
        // considered raw data and made available via a `Blob`.
        selectHandlerFromConfig();
        if (handler == null) {
          // trim any charset specified
          const cleanedContentType = contentType.includes(';') ? contentType.split(';')[0] : contentType;
          selectHandlerFromContentType(cleanedContentType);
        }
        if (handler == null) {
          // if we get this far, it means there wasn't a handler specified via configuration, and we couldn't easily
          // resolve a handler for a text-type via the content-type. we'll have to fall back to a `Blob`.
          handler = handlers['blob'];
        }
      }
    }

    const synthesizedResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      request: req,
      config,
    };

    if (!handler) {
      if (response.body) {
        console.warn('axios-fetch: response has a body, but no handler could be resolved.');
      }
      debugLog('nohandler');
      continueChain(synthesizedResponse);
      cleanup();  // done
    } else {
      debugLog('handler', config.responseType || defaultFetchResponseType, handler);

      try {
        // dispatch data handler if found (`text`, `json`, or `blob`)
        fetchAssert((t) => t(typeof handler === 'function', "handler should be a function if resolved"));

        return handler.apply(response).then(data => {
          debugLog('data');

          // continue processing with merged-in data
          continueChain(Object.assign(synthesizedResponse, { data }));
        }, reject);
      } catch (err) {
        console.error('axios-fetch: error while decoding response data', err);
        debugLog('error', err);
        reject(err);
      } finally {
        cleanup();
      }
    }
  };

  const handleError = err => {
    debugLog('error', err);
    reject(err);
  };

  debugLog('fire');

  // fire the request
  fetchHandle = (config.fetcher || fetch)(req, Object.assign({}, fetchOptions, {
    signal,
  })).then(handleResponse, handleError);
}

export function configFromURL(url, config) {
  config = config || {};
  if (!utils.isUndefined(url) && (!utils.isUndefined(URL) && url instanceof URL)) {
    config.url = url.toString();
  }
  return config;
}

export function isRequest(thing) {
  if (platform.isNode) {
    return thing instanceof FetchRequest;
  } else if (platform.isStandardBrowserEnv) {
    return thing instanceof (window.Request);
  } else if (platform.isGenericJs) {
    return thing instanceof FetchRequest;
  }
}

export function configFromRequest(request, config) {
  config = config || {};
  if (!utils.isUndefined(request)) {
    if (utils.isString(request.url)) {
      config.url = request.url;
    }
    // if (utils.isString(request.method)) {
    //   config.method = request.method;
    // }
    // if (request.headers.length > 0) {
    //   config.headers = Object.fromEntries(request.headers.entries());
    // }
    // TODO(sgammon): full support for entire axios config
  }
  return config;
}

export default function fetchAdapter(config) {
  return new Promise(function (accept, reject) {
    try {
      dispatchFetch(config, accept, reject);
    } catch (err) {
      reject(err);
    }
  });
}
