import {getFetch} from './fetch.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

let undiciAgent;

const factory = async (config) => {

  let undici;
  try {
    undici = await import('undici');
  } catch (e) {
    undici = null;
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

  const adapter = getFetch({
    env: {
      fetch: async (request, fetchOptions = {}) => {

        if (useFetch) {
          let response;
          try {;
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

        if (!undiciAgent) {
          undiciAgent = new undici.Agent();
        }
        let response;
        try {
          response = await undici.request(request.url, {
            signal: request.signal,
            method: request.method,
            headers: request.headers,
            body: request.body,
            dispatcher: undiciAgent.compose(undici.interceptors.redirect({
              maxRedirections: typeof config.maxRedirects === 'number' ? config.maxRedirects : 21,
              throwOnMaxRedirect: true
            }))
          });
        } catch (error) {
          if (error.message?.includes('ENOTFOUND')) {
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

  return adapter(config);

};

export default factory;
