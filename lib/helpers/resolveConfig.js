import platform from '../platform/index.js';
import utils from '../utils.js';
import isURLSameOrigin from './isURLSameOrigin.js';
import cookies from './cookies.js';
import buildFullPath from '../core/buildFullPath.js';
import mergeConfig from '../core/mergeConfig.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import buildURL from './buildURL.js';

const FORM_DATA_CONTENT_HEADERS = ['content-type', 'content-length'];

function setFormDataHeaders(headers, formHeaders, policy) {
  if (policy !== 'content-only') {
    headers.set(formHeaders);
    return;
  }

  Object.entries(formHeaders).forEach(([key, val]) => {
    if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });
}

// Node's WHATWG URL parser returns `username` and `password` percent-encoded.
// Decode before composing the `auth` option so credentials such as
// `my%40email.com:pass` are sent as `my@email.com:pass`. Falls back to the
// original value for malformed input so a bad encoding never throws.

const decodeURIComponentSafe = (val) => {
  try {
    return val ? decodeURIComponent(val) : val;
  } catch (e) {
    return val;
  }
}


function resolveConfig(config) {
  const newConfig = mergeConfig({}, config);

  // Read only own properties to prevent prototype pollution gadgets
  // (e.g. Object.prototype.baseURL = 'https://evil.com').
  const own = (key) => (utils.hasOwnProp(newConfig, key) ? newConfig[key] : undefined);

  const data = own('data');
  let withXSRFToken = own('withXSRFToken');
  const xsrfHeaderName = own('xsrfHeaderName');
  const xsrfCookieName = own('xsrfCookieName');
  let headers = own('headers');
  let auth = own('auth');
  const baseURL = own('baseURL');
  const allowAbsoluteUrls = own('allowAbsoluteUrls');
  const url = own('url');

  newConfig.headers = headers = AxiosHeaders.from(headers);

  newConfig.url = buildURL(
    buildFullPath(baseURL, url, allowAbsoluteUrls),
    own('params'),
    own('paramsSerializer')
  );

  if (newConfig.url.includes('@')) {
    const parsed = new URL(newConfig.url, platform.origin);
    if (parsed.username || parsed.password) {
      auth = auth || {
        username: decodeURIComponentSafe(parsed.username),
        password: decodeURIComponentSafe(parsed.password)
      }

      parsed.username = '';
      parsed.password = '';
      newConfig.url = parsed.href;
    }
  }

  // HTTP basic authentication
  if (auth) {
    headers.set(
      'Authorization',
      'Basic ' +
        platform.toBase64((auth.username || '') + ':' + (auth.password || ''))
    );
  }

  if (utils.isFormData(data)) {
    if (
      platform.hasStandardBrowserEnv ||
      platform.hasStandardBrowserWebWorkerEnv ||
      utils.isReactNative(data)
    ) {
      headers.setContentType(undefined); // browser/web worker/RN handles it
    } else if (utils.isFunction(data.getHeaders)) {
      // Node.js FormData (like form-data package)
      setFormDataHeaders(headers, data.getHeaders(), own('formDataHeaderPolicy'));
    }
  }

  // Add xsrf header
  // This is only done if running in a standard browser environment.
  // Specifically not if we're in a web worker, or react-native.

  if (platform.hasStandardBrowserEnv) {
    if (utils.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }

    // Strict boolean check — prevents proto-pollution gadgets (e.g. Object.prototype.withXSRFToken = 1)
    // and misconfigurations (e.g. "false") from short-circuiting the same-origin check and leaking
    // the XSRF token cross-origin.
    const shouldSendXSRF =
      withXSRFToken === true || (withXSRFToken == null && isURLSameOrigin(newConfig.url));

    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }

  return newConfig;
}

export default resolveConfig;
