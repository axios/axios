'use strict';

import utils from '../utils.js';
import buildURL from '../helpers/buildURL.js';
import InterceptorManager from './InterceptorManager.js';
import dispatchRequest from './dispatchRequest.js';
import mergeConfig from './mergeConfig.js';
import buildFullPath from './buildFullPath.js';
import validator from '../helpers/validator.js';
import AxiosHeaders from './AxiosHeaders.js';

const validators = validator.validators;

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 *
 * @return {Axios} A new instance of Axios
 */
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    // Capture a lightweight stack snapshot at the call site *before* the
    // async dispatch.  We use this later to stitch the caller's frames onto
    // any error that bubbles out of the adapter — making the final stack trace
    // point at the user's code instead of axios-internal frames.
    //
    // Important constraints:
    //  * We only append when V8's native async-stack promotion has NOT already
    //    included the caller frames.  On Node >= 12 (V8) async errors already
    //    carry the full async call chain, so appending would duplicate frames.
    //  * We capture HERE (before the await) so the snapshot includes the
    //    synchronous call site; the original implementation captured inside
    //    the catch block which meant the snapshot started from an axios frame.
    let requestStack = null;
    try {
      let dummy = {};
      Error.captureStackTrace ? Error.captureStackTrace(dummy) : (dummy = new Error());
      if (dummy.stack) {
        // Drop line 0 ("Error") and line 1 (this frame), keep the rest.
        // Also strip pure Node-internal frames so we only keep user-land frames.
        const frames = dummy.stack
          .split('\n')
          .slice(2)
          .filter((line) => line && !/\(node:[^)]+\)/.test(line));
        requestStack = frames.length ? frames.join('\n') : null;
      }
    } catch (e) {
      // Error.captureStackTrace is V8-only; silently ignore on other engines.
    }

    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error && requestStack) {
        try {
          const errStack = String(err.stack || '');
          if (!errStack) {
            err.stack = requestStack;
          } else {
            // V8 async-stack promotion check:
            // When an error propagates back through an async call chain V8
            // automatically includes the awaiting frames.  We detect this by
            // checking whether the tail of err.stack already ends with the
            // same content as requestStack (modulo the final newline).  If so,
            // V8 did the work and we must not append — doing so duplicates
            // every frame in requestStack.
            //
            // We also guard against a more subtle case: even when err.stack
            // does not end with requestStack, individual frames may already
            // appear inside it (e.g. the user's immediate call-site frame that
            // V8 stitched in via async promotion).  We therefore find the
            // *first* user-land frame in requestStack and skip appending if
            // it already appears in err.stack anywhere.
            const tailCheck = !errStack.endsWith(requestStack.replace(/^.+\n.+\n/, ''));
            // Only append the caller stack when the error stack does not already
            // reference the same source file as the first user-land frame in
            // requestStack.  Comparing by file path (not line:col) is important
            // because V8 async-stack promotion may report the same call site as
            // an "async" frame (line:col_a) while requestStack has it as a sync
            // frame (line:col_b); matching on the bare file path handles both.
            const firstFrame = requestStack.split('\n')[0] || '';
            // Extract just the file path from a frame like:
            //   "    at fn (file:///path/to/file.js:10:5)"
            //   "    at file:///path/to/file.js:10:5"
            const filePathMatch = firstFrame.match(/\(([^)]+):\d+:\d+\)|at (\S+):\d+:\d+/);
            const firstFilePath = filePathMatch
              ? (filePathMatch[1] || filePathMatch[2] || '').replace(/:\d+:\d+$/, '')
              : '';
            if (tailCheck && firstFilePath && !errStack.includes(firstFilePath)) {
              err.stack += '\n' + requestStack;
            }
          }
        } catch (e) {
          // ignore the case where "stack" is an un-writable property
        }
      }

      throw err;
    }
  }

    _request(configOrUrl, config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    config = mergeConfig(this.defaults, config);

    const {transitional, paramsSerializer, headers} = config;

    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }

    if (paramsSerializer != null) {
      if (utils.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        }
      } else {
        validator.assertOptions(paramsSerializer, {
          encode: validators.function,
          serialize: validators.function
        }, true);
      }
    }

    // Set config.allowAbsoluteUrls
    if (config.allowAbsoluteUrls !== undefined) {
      // do nothing
    } else if (this.defaults.allowAbsoluteUrls !== undefined) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }

    validator.assertOptions(config, {
      baseUrl: validators.spelling('baseURL'),
      withXsrfToken: validators.spelling('withXSRFToken')
    }, true);

    // Set config.method
    config.method = (config.method || this.defaults.method || 'get').toLowerCase();

    // Flatten headers
    let contextHeaders = headers && utils.merge(
      headers.common,
      headers[config.method]
    );

    headers && utils.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      (method) => {
        delete headers[method];
      }
    );

    config.headers = AxiosHeaders.concat(contextHeaders, headers);

    // filter out skipped interceptors
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    let i = 0;
    let len;

    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), undefined];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;

      promise = Promise.resolve(config);

      let prevResult = config;
      while (i < len) {
        promise = promise
            .then(chain[i++])
            .then(result => { prevResult = result !== undefined ? result : prevResult })
            .catch(chain[i++])
            .then(() => prevResult);
      }

      return promise;
    }

    len = requestInterceptorChain.length;

    let newConfig = config;

    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }

    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    i = 0;
    len = responseInterceptorChain.length;

    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++]).catch(responseInterceptorChain[i++]);
    }

    return promise;
  }

  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url,
        data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

export default Axios;
