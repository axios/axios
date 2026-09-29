import {getFetch} from './fetch.js';
import platform from '../platform/index.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const $context = Symbol('context');

let undici;
let adapter;

const createAdapter = () => getFetch({
  env: {
    fetch: async (request, fetchOptions) => {
      const { useFetch, responseType, maxRedirects } = fetchOptions[$context];

      if (useFetch) {
        let response;
        try {
          response = await undici.fetch(request, fetchOptions);
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
          dispatcher: undici.getGlobalDispatcher().compose(undici.interceptors.redirect({
            maxRedirections: typeof maxRedirects === 'number' ? maxRedirects : 21,
            throwOnMaxRedirect: true
          }))
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
    Request: undici.Request,
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
    adapter = createAdapter();
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

  return adapter({...config, data, fetchOptions});

};

export const getUndici = () => (utils.isFunction(platform.hasUndici) && platform.hasUndici() ? factory : false);

export default factory;
