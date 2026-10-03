import {getFetch} from './fetch.js';
import platform from '../platform/index.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const $context = Symbol('context');

let undici;
let adapter;
let requestAdapter;

// Composed redirect dispatchers, keyed by global dispatcher and then by the
// redirect limit, so each request does not compose a new one.
const redirectDispatchers = new WeakMap();

const getRedirectDispatcher = (maxRedirections) => {
  const dispatcher = undici.getGlobalDispatcher();
  let byLimit = redirectDispatchers.get(dispatcher);
  if (!byLimit) {
    byLimit = new Map();
    redirectDispatchers.set(dispatcher, byLimit);
  }
  let composed = byLimit.get(maxRedirections);
  if (!composed) {
    composed = dispatcher.compose(undici.interceptors.redirect({
      maxRedirections,
      throwOnMaxRedirect: true
    }));
    byLimit.set(maxRedirections, composed);
  }
  return composed;
};

const redirectStatues = [301, 302, 303, 307, 308];
const getRedirectLimitDispatcher = (dispatcher, maxRedirects) => {
  let redirectCount = 0;

  return (dispatcher || undici.getGlobalDispatcher()).compose((dispatch) => (opts, handler) => dispatch(opts, {
    __proto__: handler,
    onResponseStart(controller, statusCode, headers, statusMessage) {
      if (redirectStatues.includes(statusCode) && headers && headers.location && ++redirectCount > maxRedirects) {
        controller.abort(new Error('redirect count exceeded'));
        return;
      }
      return handler.onResponseStart(controller, statusCode, headers, statusMessage);
    }
  }));
};

const createAdapter = (useRequestObject) => getFetch({
  env: {
    fetch: async (request, fetchOptions) => {
      const { useFetch, responseType, maxRedirects } = fetchOptions[$context];

      if (!useRequestObject) {
        request = { url: request, ...fetchOptions };
      }

      if (useFetch) {
        let response;
        try {
          response = await undici.fetch(
            request,
            utils.isNumber(maxRedirects) && maxRedirects > 0
              ? {
                ...fetchOptions,
                dispatcher: getRedirectLimitDispatcher(fetchOptions.dispatcher, maxRedirects)
              }
              : fetchOptions
          );
        } catch (error) {
          if (error.cause && error.cause.message === 'redirect count exceeded') {
            throw new AxiosError(
              'Maximum number of redirects exceeded',
              AxiosError.ERR_FR_TOO_MANY_REDIRECTS
            )
          }
          throw error;
        }
        if (responseType === 'formdata') {
          const originalFormData = response.formData.bind(response);
          response.formData = async () => {
            const formData = new FormData();
            for (const entry of await originalFormData()) {
              formData.append(...entry);
            }
            return formData;
          };
        }
        return response;
      }

      let response;
      try {
        response = await undici.request(request.url, {
          signal: request.signal,
          method: request.method,
          headers: request.headers,
          body: request.body,
          dispatcher: getRedirectDispatcher(typeof maxRedirects === 'number' ? maxRedirects : 21)
        });
      } catch (error) {
        if (error && utils.isString(error.message) && error.message.includes('ENOTFOUND')) {
          throw new TypeError('Load failed', {cause: error});
        }
        if (error.message === 'max redirects') {
          throw new AxiosError(
            'Maximum number of redirects exceeded',
            AxiosError.ERR_FR_TOO_MANY_REDIRECTS
          )
        }
        throw error;
      }

      const asResponse = () => new undici.Response(response.body, {
        status: response.statusCode,
        statusText: response.statusText,
        headers: response.headers,
      });

      return {
        status: response.statusCode,
        statusText: response.statusText,
        headers: response.headers,
        body: response.body,
        text: () => response.body.text(),
        json: () => response.body.json(),
        arrayBuffer: () => response.body.arrayBuffer(),
        blob: () => asResponse().blob(),
        formData: () => asResponse().formData()
      };
    },
    Request: useRequestObject ? undici.Request : null,
    Response: undici.Response
  }
});

const factory = async (config) => {

  if (undici) {
    await undici;
  } else {
    try {
      undici = await platform.importUndici();
    } catch (e) {
      throw new AxiosError(
        'Cannot find Undici module for Axios adapter, did you forget to install it?',
        AxiosError.ERR_NOT_SUPPORT,
        config
      );
    }
  }

  const responseType = config.responseType ? (config.responseType + '').toLowerCase() : 'text';
  const hasMaxContentLength = utils.isNumber(config.maxContentLength) && config.maxContentLength > -1;
  const useFetch = (
    !!config.onDownloadProgress ||
    hasMaxContentLength ||
    responseType === 'stream' ||
    responseType === 'response' ||
    responseType === 'formdata' ||
    responseType === 'blob'
  );

  if (!adapter) {
    adapter = createAdapter(true);
    requestAdapter = createAdapter(false);
  }

  const fetchOptions = Object.assign(
    Object.create(null),
    utils.hasOwnProp(config, 'fetchOptions') ? config.fetchOptions : null,
    { [$context]: { useFetch, responseType, maxRedirects: config.maxRedirects } }
  );

  let data = config.data;

  // Undici does not recognize FormData instances from other realms (e.g. the
  // Node.js global FormData) and would serialize them as text, so copy the
  // entries into an Undici FormData instance.
  if (utils.isSpecCompliantForm(data) && !(data instanceof undici.FormData)) {
    const formData = new undici.FormData();
    for (const entry of data) {
      formData.append(...entry);
    }
    data = formData;
  }

  // The Request object serializes FormData, Blob and URLSearchParams bodies,
  // sets a default Content-Type for string bodies, and gives the stream support
  // that upload progress needs. Skip it only when it would add nothing.
  const useRequestObject =
    useFetch ||
    !!config.onUploadProgress ||
    !(
      data == null ||
      utils.isArrayBuffer(data) ||
      utils.isArrayBufferView(data) ||
      (utils.isString(data) && !!config.headers.getContentType())
    );

  return (useRequestObject ? adapter : requestAdapter)({...config, data, fetchOptions});

};

let hasUndiciCheck;
let hasUndiciResult = false;

export const getUndici = () => {
  const check = platform.hasUndici;
  if (check !== hasUndiciCheck) {
    hasUndiciCheck = check;
    hasUndiciResult = utils.isFunction(check) && check();
  }
  return hasUndiciResult ? factory : false;
};

export default factory;
