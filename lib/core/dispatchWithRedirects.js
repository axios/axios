import utils from '../utils.js';
import settle from "../core/settle.js";
import buildFullPath from "../core//buildFullPath.js";
import platform from "../platform/index.js";
import AxiosError from "../core//AxiosError.js";
import AxiosHeaders from '../core//AxiosHeaders.js';
import isURLSameOrigin from "../helpers/isURLSameOrigin.js";
import isSubdomain from "../helpers/isSubdomain.js";
import BufferedStream from "../helpers/BufferedStream.js";

const redirectCodes = utils.list('301,302,303,307,308', ',');

const isRedirectStatus = status => redirectCodes['' + status]

const followRedirect = async (dispatch, response, redirectsCount) => {
  const {config, status} = response;
  let {data, maxRedirects = 5, beforeRedirect} = config;
  let method = config.method.toUpperCase();
  let headers = AxiosHeaders.concat(config.headers);
  let loc = response.headers.get('Location');

  if (maxRedirects >= 0 && redirectsCount > maxRedirects) {
    throw new AxiosError('Maximum number of redirects exceeded', AxiosError.ERR_FR_TOO_MANY_REDIRECTS)
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
        url: originalUrl,
        redirectTo: redirectedUrl,
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

    return dispatchWithRedirects(dispatch, redirectedConfig, redirectsCount + 1);
  }

  return response;
}

const dispatchWithRedirects = (dispatch, dispatchConfig, redirectIndex) => {
  console.log(`Request ${dispatchConfig.url}`);
  return dispatch(dispatchConfig).then(response => {
    console.log(`Response [${response.status}]`);
    if (redirectCodes[response.status + '']) {
      return followRedirect(dispatch, response, redirectIndex)
    }

    return response;
  });
}

export default (initialConfig, dispatch) => {
  const originalValidateFn = initialConfig.validateStatus;
  let {signal, data, buffering} = initialConfig;
  let {flushTimeout, maxBufferSize} = buffering || {};

  const kind = utils.kindOf(data);

  const shouldBeBuffered = maxBufferSize &&
    data && (kind === 'readablestream' || kind === 'request' || utils.isAsyncIterable(data));

  if (shouldBeBuffered) {
    data = new BufferedStream(data, {
      signal,
      timeWindow: flushTimeout,
      max: maxBufferSize
    });
  }

  return dispatchWithRedirects(
    dispatch,
    utils.merge(
      initialConfig,
      {
        data,
        fetchOptions: {
          redirect: platform.isNode ? 'manual' : undefined
        },
        validateStatus: (status) => isRedirectStatus(status) || !originalValidateFn || originalValidateFn(status),
        meta: {}
      }
    ),
    0
  ).then(redirectedResponse => new Promise((resolve, reject) => {
    shouldBeBuffered && data.flush();
    redirectedResponse.config && Object.assign(redirectedResponse.config, {
      validateStatus: originalValidateFn
    });
    settle(resolve, reject, redirectedResponse);
  }), err => {
    shouldBeBuffered && data.flush();
    throw err;
  })
}
