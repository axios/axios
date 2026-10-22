import utils from '../utils.js';
import settle from '../core/settle.js';
import transitionalDefaults from '../defaults/transitional.js';
import AxiosError from '../core/AxiosError.js';
import createCanceledError from '../cancel/createCanceledError.js';
import normalizeURLForProtocolCheck from '../helpers/normalizeURLForProtocolCheck.js';
import parseProtocol from '../helpers/parseProtocol.js';
import platform from '../platform/index.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import cookies from '../helpers/cookies.js';
import { progressEventReducer } from '../helpers/progressEventReducer.js';
import resolveConfig from '../helpers/resolveConfig.js';
import { toByteStringHeaderObject } from '../helpers/sanitizeHeaderValue.js';

const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

export default isXHRAdapterSupported &&
  function (config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      let useAsyncXsrf;
      try {
        const store =
          platform.hasStandardBrowserEnv && typeof window !== 'undefined' && window.cookieStore;
        useAsyncXsrf = store && utils.isFunction(store.get);
      } catch (e) {
        // A restricted Cookie Store getter must retain the synchronous fallback.
      }
      let xsrfCookieName;
      const _config = resolveConfig(
        config,
        useAsyncXsrf
          ? (name) => {
              xsrfCookieName = name;
              return null;
            }
          : undefined
      );
      let requestData = _config.data;
      const requestHeaders = AxiosHeaders.from(_config.headers).normalize();
      let { responseType, onUploadProgress, onDownloadProgress } = _config;
      let onCanceled;
      let onSignalAbort;
      let timeoutId;
      let uploadThrottled, downloadThrottled;
      let flushUpload, flushDownload, flushDownloadWithEvent;

      function done() {
        clearTimeout(timeoutId);
        // A final progress callback must not prevent the remaining cleanup.
        // Report errors asynchronously, as onloadend and the throttle timer do.
        try {
          flushUpload && flushUpload(); // flush events
        } catch (err) {
          setTimeout(() => {
            throw err;
          });
        }
        try {
          flushDownload && flushDownload(); // flush events
        } catch (err) {
          setTimeout(() => {
            throw err;
          });
        }

        // A flush can synchronously cancel the request and reenter done().
        // In that case the inner call has already detached these listeners.
        if (request) {
          downloadThrottled && request.removeEventListener('progress', downloadThrottled);
          if (request.upload) {
            uploadThrottled && request.upload.removeEventListener('progress', uploadThrottled);
            flushUpload && request.upload.removeEventListener('loadend', flushUpload);
          }
        }

        _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

        _config.signal && _config.signal.removeEventListener('abort', onSignalAbort);
      }

      let request = new XMLHttpRequest();

      request.open(_config.method.toUpperCase(), _config.url, true);

      // Set the request timeout in MS
      request.timeout = _config.timeout;

      function onloadend(event) {
        if (!request) {
          return;
        }

        // Status 0 means no response was received, which onerror and onabort normally
        // reject before this runs. Firefox 152 fires only readystatechange and loadend for
        // navigation-canceled requests (https://bugzilla.mozilla.org/show_bug.cgi?id=1505389),
        // leaving settle() to resolve them as an empty success. ECONNABORTED is the error
        // onabort raised on Firefox 151. Reads over file:, which some environments report as
        // status 0 on success, are excluded by the request URL's scheme after browser-style
        // preprocessing, by the page origin's scheme for relative URLs (which inherit it), or
        // by responseURL where implemented.
        if (
          request.status === 0 &&
          (parseProtocol(normalizeURLForProtocolCheck(_config.url)) ||
            parseProtocol(platform.origin)) !== 'file' &&
          !(request.responseURL && request.responseURL.startsWith('file:'))
        ) {
          reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));
          done();

          // Clean up request
          request = null;
          return;
        }

        // When loadend is still dispatching, flushing with it gives progress
        // listeners a final delivery whose event has a live target. The legacy
        // ready-state fallback has no event, so replay its pending progress.
        // A throwing listener must not block settlement; rethrow asynchronously,
        // matching how listener errors surface on the throttle timer path.
        try {
          if (event) {
            flushDownloadWithEvent && flushDownloadWithEvent(event);
          } else {
            flushDownload && flushDownload();
          }
        } catch (err) {
          setTimeout(() => {
            throw err;
          });
        }

        // A final progress callback can cancel the request synchronously.
        if (!request) {
          return;
        }

        // Prepare the response
        const responseHeaders = AxiosHeaders.from(
          'getAllResponseHeaders' in request && request.getAllResponseHeaders()
        );
        const responseData =
          !responseType || responseType === 'text' || responseType === 'json'
            ? request.responseText
            : request.response;
        const response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config,
          request,
        };

        settle(
          function _resolve(value) {
            resolve(value);
            done();
          },
          function _reject(err) {
            reject(err);
            done();
          },
          response
        );

        // Clean up request
        request = null;
      }

      if ('onloadend' in request) {
        // Use onloadend if available
        request.onloadend = onloadend;
      } else {
        // Listen for ready state to emulate onloadend
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (
            request.status === 0 &&
            !(request.responseURL && request.responseURL.startsWith('file:'))
          ) {
            return;
          }
          // readystate handler is calling before onerror or ontimeout handlers,
          // so we should call onloadend on the next 'tick'
          setTimeout(onloadend);
        };
      }

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));
        done();

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError(event) {
        // Browsers deliver a ProgressEvent in XHR onerror
        // (message may be empty; when present, surface it)
        // See https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/error_event
        const msg = event && event.message ? event.message : 'Network Error';
        const err = new AxiosError(msg, AxiosError.ERR_NETWORK, config, request);
        // attach the underlying event for consumers who want details
        err.event = event || null;
        reject(err);
        done();
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        if (!request) return;
        let timeoutErrorMessage = _config.timeout
          ? 'timeout of ' + _config.timeout + 'ms exceeded'
          : 'timeout exceeded';
        const transitional = _config.transitional || transitionalDefaults;
        if (_config.timeoutErrorMessage) {
          timeoutErrorMessage = _config.timeoutErrorMessage;
        }
        reject(
          new AxiosError(
            timeoutErrorMessage,
            transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
            config,
            request
          )
        );
        done();

        // Clean up request
        request = null;
      };

      // Remove Content-Type if data is undefined
      requestData === undefined && requestHeaders.setContentType(null);

      // Add withCredentials to request if needed
      if (!utils.isUndefined(_config.withCredentials)) {
        request.withCredentials = !!_config.withCredentials;
      }

      // Add responseType to request if needed
      if (responseType && responseType !== 'json') {
        request.responseType = _config.responseType;
      }

      // Handle progress if needed
      if (onDownloadProgress) {
        [downloadThrottled, flushDownload, flushDownloadWithEvent] = progressEventReducer(
          onDownloadProgress,
          true
        );
        request.addEventListener('progress', downloadThrottled);
      }

      // Not all browsers support upload events
      if (onUploadProgress && request.upload) {
        [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);

        request.upload.addEventListener('progress', uploadThrottled);

        request.upload.addEventListener('loadend', flushUpload);
      }

      if (_config.cancelToken || _config.signal) {
        // Handle cancellation
        // eslint-disable-next-line func-names
        onCanceled = (cancel) => {
          if (!request) {
            return;
          }
          reject(createCanceledError(cancel, config, request));
          const xhr = request;
          done();
          request = null;
          xhr.abort();
        };

        _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
        if (!request) return;
        if (_config.signal) {
          onSignalAbort = () => onCanceled(_config.signal.reason);
          _config.signal.aborted
            ? onCanceled(_config.signal.reason)
            : _config.signal.addEventListener('abort', onSignalAbort);
        }
      }

      if (!request) return;

      const protocol = parseProtocol(_config.url);

      if (protocol && !platform.protocols.includes(protocol)) {
        reject(
          new AxiosError(
            'Unsupported protocol ' + protocol + ':',
            AxiosError.ERR_BAD_REQUEST,
            config
          )
        );
        done();
        return;
      }

      const sendRequest = () => {
        if (!request) return;
        // Apply headers after an asynchronous XSRF read so existing headers are
        // replaced through AxiosHeaders rather than appended by the native XHR.
        if ('setRequestHeader' in request) {
          utils.forEach(
            toByteStringHeaderObject(requestHeaders),
            function setRequestHeader(val, key) {
              request.setRequestHeader(key, val);
            }
          );
        }
        request.send(requestData || null);
      };

      if (xsrfCookieName) {
        // Native XHR timeout starts at send(). Cover cookie preparation and the
        // subsequent request with the same budget and existing timeout handler.
        const now =
          typeof performance !== 'undefined' && utils.isFunction(performance.now)
            ? () => performance.now()
            : Date.now;
        const deadline = request.timeout > 0 ? now() + Number(request.timeout) : undefined;
        const abortOnTimeout = () => {
          if (!request) return;
          const xhr = request;
          xhr.ontimeout();
          xhr.abort();
        };
        if (deadline !== undefined) {
          const scheduleTimeout = () => {
            const remaining = deadline - now();
            if (remaining > 0) {
              // Browser timers overflow above the signed 32-bit delay limit.
              timeoutId = setTimeout(scheduleTimeout, Math.min(remaining, 0x7fffffff));
            } else {
              abortOnTimeout();
            }
          };
          scheduleTimeout();
        }

        cookies
          .readAsync(xsrfCookieName)
          .then((value) => {
            if (!request) return;
            // Promise callbacks may run before an overdue timer after a busy task.
            if (deadline !== undefined && now() >= deadline) {
              abortOnTimeout();
              return;
            }
            if (value) {
              const headerName =
                utils.hasOwnProp(_config, 'xsrfHeaderName') && _config.xsrfHeaderName;
              requestHeaders.set(headerName, value);
            }
            sendRequest();
          })
          .catch((error) => {
            if (!request) return;
            reject(AxiosError.from(error, null, config, request));
            done();
            request = null;
          });
      } else {
        sendRequest();
      }
    });
  };
