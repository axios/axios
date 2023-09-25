'use strict';

import platform from '../platform/index.js';
import settle from './../core/settle.js';
import AxiosError from '../core/AxiosError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import buildFullPath from '../core/buildFullPath.js';
import CanceledError from '../cancel/CanceledError.js';
import parseProtocol from '../helpers/parseProtocol.js';
import AbortController from '#abortController';

import {
  isFormData,
  isUndefined,
  isString,
} from './../utils.js';

import {
  fetcher,
  Headers as FetchHeaders,
  Request as FetchRequest,
  Response as FetchResponse,
} from '#fetchApi';

const defaultFetchResponseType = 'json';

const fetchAssertions = true;
const fetchDebugLogging = true;

export {
  fetcher,
  FetchHeaders,
  FetchRequest,
  FetchResponse,
}

const plainMime = 'text/plain';
const contentTypeHeader = 'Content-Type';
const contentLengthHeader = 'Content-Length';
const transferEncodingHeader = 'Transfer-Encoding';

const textLikeContentTypes = new Set([
    plainMime,
    'text/html',
    'text/xml',
    'text/css',
    'text/javascript',
    'application/xml',
    'application/xhtml+xml',
    'application/javascript'
]);

const knownNoBodyResponseStatuses = new Set([
    204,
    205,
    304
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

const handlerFactory = (response) => {
  return {
    'text': response.text,
    'form': response.formData,
    'blob': response.blob,
    'json': function jsonShim() {
      return patchDecodeJson(response).json();
    }
  }
};

const selectHandlerFromConfig = (config, handlers) => {
  const handler = handlers[config.responseType] || null;
  debugLog('handler from: config', config.responseType, handler);
  return handler;
};

const selectHandlerFromContentType = (config, handlers, contentType) => {
  const resolvedContentType = (
      // if it's a text-like content type, resolve it as text/plain
      textLikeContentTypes.has(contentType) ? plainMime : contentType
  );
  const handler = {
    'application/json': handlers['json'],
    'text/plain': handlers['text'],
  }[resolvedContentType] || null;

  debugLog('handler from: content-type', config.responseType, handler);
  return handler;
};

function isResponseEligibleForBody(response) {
  // status cannot be present in `knownNoBodyResponseStatuses` in order to have a parse-able body. additionally, the
  // response shouldn't be an opaque redirect; those should be handed directly back to the developer.
  return !knownNoBodyResponseStatuses.has(
      response.status
  );
}

function processResponseBody(config, response, responseHeaders) {
  let hasBody = false;
  let handler = null;
  const handlers = handlerFactory(response);

  // case: non-chunked body with `content-length` header, and...
  // case: chunked body with a `transfer-encoding` header
  const hasContentType = responseHeaders.has(contentTypeHeader);
  if ((responseHeaders.has(contentLengthHeader) || responseHeaders.has(transferEncodingHeader))) {
    const hasKnownLength = responseHeaders.has(contentLengthHeader);
    const contentType = responseHeaders.get(contentTypeHeader);

    if (hasKnownLength) {
      debugLog('body has known length', responseHeaders.get(contentLengthHeader));

      // the response has a content-length, and therefore a known response size.
      hasBody = +(responseHeaders.get(contentLengthHeader) || 0) > 0;
    } else {
      debugLog('body is chunked');

      // the response has a transfer-encoding header indicating a chunked (streamed) response.
      hasBody = true;
    }

    if (hasBody) {
      // if we have detected a body, select a handler to consume the body based on config, or fall-back to the
      // content-type to resolve a value. if all else fails, the data is considered raw data and made available via a
      // raw `Blob`.
      handler = config.responseType ? selectHandlerFromConfig(config, handlers) : null;
      if (config.responseType) {
        debugLog('resolved handler from config: ', handler);
      }

      if (hasContentType && handler == null) {
        // trim any charset specified
        const cleanedContentType = contentType.includes(';') ? contentType.split(';')[0] : contentType;
        handler = selectHandlerFromContentType(config, handlers, cleanedContentType);
        debugLog('resolved handler from content-type: ', handler);
      }
      if (handler == null) {
        debugLog('no handler found: falling back to `blob`');

        // if we get this far, it means there wasn't a handler specified via configuration, and we couldn't easily
        // resolve a handler for a text-type via the content-type. we'll have to fall back to a `Blob`.
        handler = handlers['blob'] || null;
      }
    }
  }
  return [hasBody, handler];
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

  // safely parse into `URL`, or use existing/cached URL via config. skip this step for relative URLs, which do not
  // parse into `URL` objects because they do not encapsulate origin info. make sure to let protocol-relative URLs
  // through, though, which are considered absolute.
  let parsedUrl = config.parsedUrl;
  if (!parsedUrl && !(fullPath.startsWith('/') && !fullPath.startsWith('//'))) {
    try {
      // we are unable to parse the URL if it (1) is a relative URL, or (2) is a malformed URL to begin with. to avoid
      // #1 causing an error, we can make an attempt here to use the current window origin as a relative base; this will
      // only work in browsers, though, so we need to be careful to check that we have an origin in the first place.
      if (platform.isStandardBrowserEnv) {
        // origin = `https://domain.com` (protocol + host + port if non-standard)
        // fullPath = `/foo/bar` (relative path)
        // `fullPath = https://domain.com/foo/bar`
        fullPath = window.location.origin + fullPath;
      }
      parsedUrl = new URL(fullPath);
    } catch (urlParseErr) {
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
  if (isFormData(body) && platform.isStandardBrowserEnv) {
    requestHeaders.setContentType(false);
  }

  // HTTP basic authentication
  if (config.auth) {
    const username = config.auth.username || '';
    const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
    requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
  }

  // honor XHR `withCredentials` as fetch `mode:cors`
  if (!isUndefined(config.withCredentials)) {
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
  const serializedHeaders = requestHeaders.toJSON(true);
  const headers = new FetchHeaders();
  Object.entries(serializedHeaders).forEach(([key, value]) => {
    headers.set(key, value);  // already merged
  });
  debugLog('fetch headers', Object.fromEntries(headers.entries()));

  // body-less requests should not have content-type or content-length headers
  body === undefined && (
      headers.delete(contentTypeHeader) ||
      headers.delete(contentLengthHeader)
  );

  debugLog(`request: ${method} ${parsedUrl ? parsedUrl.toString() : fullPath} (has body: ${!!body})`);
  debugLog(`finalized headers`, Object.fromEntries(headers.entries()));

  // prep HTTP request
  req = new FetchRequest(parsedUrl || fullPath, {
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
    return settle(function _resolve(value) {
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
      debugLog('fetch cancelled; dropping response');
      return;  // canceled
    }
    debugLog('response status =', response.status, response.statusText);

    // begin preparing the response
    debugLog('raw headers', Object.fromEntries(response.headers.entries()));
    const responseHeaders = AxiosHeaders.from(
        Object.fromEntries(response.headers.entries())
    );
    debugLog('headers', responseHeaders);

    let hasBody = false;
    let handler = null;
    let eligibleForBody = isResponseEligibleForBody(response);
    debugLog('eligible for body =', eligibleForBody);

    if (eligibleForBody) {
      [hasBody, handler] = processResponseBody(
          config,
          response,
          responseHeaders,
      )
    }
    debugLog('response has body =', hasBody);

    const synthesizedResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      request: req,
      fetchResponse: response,
      config,
    };

    if (!handler) {
      if (hasBody) {
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

        debugLog('decode');
        return handler.apply(response).then(data => {
          debugLog('data');

          // continue processing with merged-in data
          return continueChain(Object.assign(synthesizedResponse, { data }));
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
  fetchHandle = (config.fetcher || fetcher)(req, Object.assign({}, fetchOptions, {
    signal,
  })).then(handleResponse, handleError);

  return fetchHandle;
}

export function configFromURL(url, config) {
  config = config || {};
  if (!isUndefined(url) && (!isUndefined(URL) && url instanceof URL)) {
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
  if (!isUndefined(request)) {
    if (isString(request.url)) {
      config.url = request.url;
    }
    // if (isString(request.method)) {
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
      return dispatchFetch(config, accept, reject);
    } catch (err) {
      reject(err);
    }
  });
}
