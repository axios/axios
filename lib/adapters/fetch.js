'use strict';

import utils from './../utils.js';
import platform from '../platform/index.js';
import settle from './../core/settle.js';
import AxiosError from '../core/AxiosError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import buildFullPath from '../core/buildFullPath.js';
import CanceledError from '../cancel/CanceledError.js';
import parseProtocol from '../helpers/parseProtocol.js';

import { AbortController } from "node-abort-controller";
import fetch, { Headers, Request } from 'cross-fetch';


const defaultFetchResponseType = 'json';

const fetchDebugLogging = false;

const debugLog = (msg, ...args) => {
  if (fetchDebugLogging) {
    console.log('[axios:fetch] ', msg, ...args);
  }
};

function patchDecodeJson(response) {
  response.json = async () => {
    return JSON.parse((await response.text()).trim());
  };
  return response;
}

export default function fetchAdapter(config) {
  return new Promise(function dispatchFetch(resolve, reject) {
    debugLog('invoked');

    const abortController = new AbortController();
    const { signal } = abortController;
    const body = config.data;
    const method = config.method.toUpperCase();
    const responseType = config.responseType;
    const requestHeaders = AxiosHeaders.from(config.headers).normalize();
    const fullPath = buildFullPath(config.baseURL, config.url);
    const parsedUrl = new URL(fullPath);
    const fetchOptions = {};

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
    const headers = new Headers();
    utils.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
      headers.set(key, val);
    });

    debugLog('headers', JSON.stringify(headers));

    // body-less requests should not have content-type or content-length headers
    body === undefined && (
      headers.delete('Content-Type') ||
      headers.delete('Content-Length')
    );

    // prep HTTP request
    req = new Request(parsedUrl, {
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
        return;  // canceled
      }

      // begin preparing the response
      const responseHeaders = AxiosHeaders.from(
        Object.fromEntries(response.headers.entries())
      );

      let handler = null;
      const handlers = {
        'text': () => response.text(),
        'json': () => patchDecodeJson(response).json(),
      };

      const selectHandlerFromConfig = () => {
        handler = handlers[config.responseType] || null;
      };

      const selectHandlerFromContentType = (contentType) => {
        handler = {
          'application/json': () => handlers['json'](),
          'text/plain': () => handlers['text'](),
        }[contentType] || null;
      };

      if (responseHeaders.has('Content-Type') && responseHeaders.has('Content-Length')) {
        const contentType = responseHeaders.get('Content-Type');
        const length = +(responseHeaders.get('Content-Length') || 0);
        if (length > 0) {
          // if we have a content-length and content-type, it means we have a body. select
          // a handler to consume the body based on config, or fall-back to the content-type
          // value.
          selectHandlerFromConfig();
          if (handler == null) {
            const cleanedContentType = contentType.split(';')[0];  // trim any charset specified
            selectHandlerFromContentType(cleanedContentType);
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
        debugLog('nohandler');
        continueChain(synthesizedResponse);
        cleanup();  // done
      } else {
        debugLog('handler', config.responseType || defaultFetchResponseType, handler);

        try {
          // dispatch data handler if found (`text` or `json`)
          return handler().then(data => {
            debugLog('data');

            // continue processing with merged-in data
            continueChain(Object.assign(synthesizedResponse, { data }));
          }, reject);
        } catch (err) {
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
    fetchHandle = fetch(req, Object.assign({}, fetchOptions, {
      signal,
    })).then(handleResponse, handleError);
  });
}
