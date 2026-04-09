import utils from '../utils.js';
import settle from "../core/settle.js";
import buildFullPath from "../core//buildFullPath.js";
import platform from "../platform/index.js";
import AxiosError from "../core//AxiosError.js";
import AxiosHeaders from '../core//AxiosHeaders.js';
import isURLSameOrigin from "../helpers/isURLSameOrigin.js";
import isSubdomain from "../helpers/isSubdomain.js";

const redirectCodes = utils.list('301,302,303,307,308', ',');

const isRedirectStatus = status => redirectCodes['' + status]



export default (initialConfig, dispatch) => {
  const originalValidateFn = initialConfig.validateStatus;

  const ts = Date.now();

  initialConfig = utils.merge(
    initialConfig,
    {
      fetchOptions: {
        redirect: platform.isNode ? 'manual' : undefined
      },
      validateStatus: (status) => {
        return isRedirectStatus(status) || !originalValidateFn || originalValidateFn(status)
      },
      meta: {

      }
    });

  const {timeout} = initialConfig;


  let redirectsCount = 0;


  const followRedirect = async (response) => {
    const {config, status} = response;
    let {data, maxRedirects = 5, beforeRedirect} = config;
    let method = config.method.toUpperCase();
    let headers = AxiosHeaders.concat(config.headers);
    let loc = response.headers.get('Location');

    if (maxRedirects >= 0 && redirectsCount++ > maxRedirects) {
      throw AxiosError('Maximum number of redirects exceeded', AxiosError.ERR_FR_TOO_MANY_REDIRECTS)
    }

    if (loc && (loc = String(loc).trim())) {
      const originalUrl = new URL(buildFullPath(config.baseURL, config.url, true), platform.origin);
      const redirectedUrl = new URL(loc, originalUrl);

      console.log(`${originalUrl} => ${redirectedUrl}`);

      if (status === 303 || ((status === 301 || status === 302) && (method !== 'GET' || method !== 'HEAD'))) {
        method = 'GET';
        data = undefined;
        headers.clear(/^content-/i);
      }

      let ret;
      let shouldSanitize;

      const redirectedConfig = utils.merge(config, {
        url: redirectedUrl + '',
        headers,
        method,
        data,
        meta: {
          isRedirected: true,
          redirectsCount
        }
      });

      if (beforeRedirect) {
        ret = await beforeRedirect({
          status,
          headers,
          config: redirectedConfig,
          redirectsCount,
          maxRedirects,
          url: originalUrl.href,
          redirectTo: redirectedUrl.href,
          response,
          sanitize: () => {
            shouldSanitize = true;
          }
        });
      }

      if (ret === false) {
        return response;
      }

      if(
        shouldSanitize ||
        !isURLSameOrigin(redirectedUrl, originalUrl)
        && !isSubdomain(redirectedUrl.host, originalUrl.host)
      ) {
        headers.clear(/^(?:(?:proxy-)?authorization|cookie)$/i);
      }

      return dispatchWithRedirects(redirectedConfig);
    }

    return response;
  }


  const dispatchWithRedirects = (dispatchConfig) => {
    console.log(`Request ${dispatchConfig.url}`);
    return dispatch(dispatchConfig).then(response => {
      console.log(`Response [${response.status}]`);
      if (redirectCodes[response.status + '']) {
        return followRedirect(response)
      }

      return response;
    });
  }

  return dispatchWithRedirects(initialConfig).then(redirectedResponse => {
    return new Promise((resolve, reject) => {
      settle(resolve, reject, redirectedResponse);
      redirectedResponse.config.validateStatus = originalValidateFn;
    })
  });
}
