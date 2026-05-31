import utils from '../utils.js';
import settle from "../core/settle.js";
import buildFullPath from "../core/buildFullPath.js";
import platform from "../platform/index.js";
import AxiosError from "../core/AxiosError.js";
import AxiosHeaders from '../core/AxiosHeaders.js';
import isSubdomain from "../helpers/isSubdomain.js";
import BufferedStream from "../helpers/BufferedStream.js";

const redirectCodes = utils.list('301,302,303,307,308');
const allowedProtocols = utils.list('http:|https:');

const MB = 1024 * 1024;

const isRedirect = (status) => status > 299 && status < 400;

const followRedirect = async (dispatch, response, redirectIndex) => {
  const {config, status} = response;
  const redirectedReqConfig = utils.merge(config, {
    headers: AxiosHeaders.concat(config.headers),
    method: config.method.toUpperCase()
  });

  let {
    data,
    maxRedirects = 21,
    beforeRedirect,
    method,
    headers,
    allowDowngrade
  } = redirectedReqConfig;

  let loc = response.headers.get('Location');

  if (maxRedirects >= 0 && redirectIndex >= maxRedirects) {
    throw new AxiosError(
      'Too many redirects',
      AxiosError.ERR_REDIRECT,
      response.config,
      response.request,
      response
    );
  }

  if (loc && (loc = String(loc).trim())) {
    const originalUrl = new URL(buildFullPath(config.baseURL, config.url, true), platform.origin);
    const redirectedUrl = new URL(loc, originalUrl);

    if (status === 303 || ((status === 301 || status === 302) && (method !== 'GET' || method !== 'HEAD'))) {
      method = 'GET';
      data = undefined;
      headers.clear(/^content-/i);
    }

    let ret;
    let shouldSanitize;

    const redirectedURLStr = redirectedUrl + '';

    const redirectedConfig = utils.merge(config, {
      url: redirectedURLStr,
      headers,
      method,
      data,
      meta: {
        redirectsCount: redirectIndex + 1
      }
    });

    if (beforeRedirect) {
      ret = await beforeRedirect({
        status,
        headers,
        config: redirectedConfig,
        redirectsCount: redirectIndex,
        maxRedirects,
        url: originalUrl,
        redirectTo: redirectedUrl,
        response,
        sanitize: (newState = true) => {
          shouldSanitize = !!newState;
        }
      });
    }

    let newRedirectedURL = redirectedUrl.href;

    if (redirectedURLStr !== newRedirectedURL) {
      redirectedConfig.url = newRedirectedURL;
    }

    let followStatusCodes = {
      ...redirectCodes,
      ...utils.list(redirectedConfig.followStatusCodes)
    };

    if (ret === false || !followStatusCodes[status + '']) {
      return response;
    }

    let protocol = originalUrl.protocol;
    let locationProtocol = redirectedUrl.protocol;

    if (!allowedProtocols[locationProtocol]) {
      throw new AxiosError(`Unsupported protocol '${locationProtocol}'`, AxiosError.ERR_NOT_SUPPORT);
    }

    if (!allowDowngrade && locationProtocol === 'http:' && protocol === 'https:') {
      throw new AxiosError('Protocol downgrade is not allowed', AxiosError.ERR_REDIRECT);
    }

    if(
      shouldSanitize ||
      shouldSanitize !== false && (
      (protocol !== locationProtocol && locationProtocol === 'http:') ||
      redirectedUrl.host !== originalUrl.host
      && !isSubdomain(redirectedUrl.host, originalUrl.host))
    ) {
      headers.clear(/^(?:(?:proxy-)?authorization|cookie)$/i);
      redirectedUrl.username = '';
      redirectedUrl.password = '';
      redirectedConfig.auth = null;
    }

    return dispatchWithRedirects(dispatch, {
      ...redirectedConfig,
      headers
    }, redirectIndex + 1);
  }

  return response;
}

const dispatchWithRedirects = (dispatch, dispatchConfig, redirectIndex) => {
  return dispatch(dispatchConfig).then(response => {
    if(isRedirect(response.status)) {
      return followRedirect(dispatch, response, redirectIndex).catch(err => {
        if (err instanceof AxiosError) {
          throw err.enhance({
            config: dispatchConfig,
            response
          });
        }

        throw err;
      })
    }

    return response;
  });
}

export default (initialConfig, dispatch) => {
  const originalValidateFn = initialConfig.validateStatus;
  let {signal, data, buffering} = initialConfig;
  let {
    timeout = 5000,
    limit = buffering === false ? 0 : 50 * MB,
    threshold = 64 * 1024
  } = buffering || {};

  const kind = utils.kindOf(data);

  timeout <= 0 && (limit = Infinity);

  const isBufferingNeeded = limit &&
    data && !(data instanceof BufferedStream) &&
    (kind === 'readablestream' || kind === 'request' || utils.isAsyncIterable(data));

  if (isBufferingNeeded) {
    data = new BufferedStream(data, {
      signal,
      timeout,
      threshold,
      limit
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
        validateStatus: (status) => isRedirect(status) || !originalValidateFn || originalValidateFn(status),
        meta: {}
      }
    ),
    0
  ).then(redirectedResponse => new Promise((resolve, reject) => {
    isBufferingNeeded && data.flush();
    redirectedResponse.config && Object.assign(redirectedResponse.config, {
      validateStatus: originalValidateFn
    });
    settle(resolve, reject, redirectedResponse);
  }), err => {
    isBufferingNeeded && data.flush();
    throw err;
  })
}
