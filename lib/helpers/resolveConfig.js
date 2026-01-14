import platform from "../platform/index.js";
import utils from "../utils.js";
import isURLSameOrigin from "./isURLSameOrigin.js";
import syncCookies, { asyncCookies } from "./cookies.js";
import buildFullPath from "../core/buildFullPath.js";
import mergeConfig from "../core/mergeConfig.js";
import AxiosHeaders from "../core/AxiosHeaders.js";
import buildURL from "./buildURL.js";

/**
 * Initialize configuration by merging, setting up headers and URL
 * @param {Object} config - The original configuration
 * @returns {Object} - The initialized configuration with extracted variables
 */
function initializeConfig(config) {
  const newConfig = mergeConfig({}, config);
  
  let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
  
  newConfig.headers = headers = AxiosHeaders.from(headers);
  
  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);
  
  return {
    newConfig,
    data,
    withXSRFToken,
    xsrfHeaderName,
    xsrfCookieName,
    headers,
    auth
  };
}

/**
 * Handle HTTP basic authentication
 * @param {Object} headers - The AxiosHeaders object
 * @param {Object} auth - The authentication configuration
 */
function handleAuthentication(headers, auth) {
  if (auth) {
    headers.set('Authorization', 'Basic ' +
      btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
    );
  }
}

/**
 * Handle FormData by setting appropriate headers
 * @param {FormData} data - The FormData object
 * @param {Object} headers - The AxiosHeaders object
 */
function handleFormData(data, headers) {
  if (utils.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(undefined); // browser handles it
    } else if (utils.isFunction(data.getHeaders)) {
      // Node.js FormData (like form-data package)
      const formHeaders = data.getHeaders();
      // Only set safe headers to avoid overwriting security headers
      const allowedHeaders = ['content-type', 'content-length'];
      Object.entries(formHeaders).forEach(([key, val]) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
          headers.set(key, val);
        }
      });
    }
  }
}

/**
 * Check if XSRF token should be added to the request
 * @param {Object} newConfig - The initialized configuration
 * @param {boolean|Function} withXSRFToken - The XSRF token configuration
 * @returns {boolean} - Whether to add XSRF token
 */
function handleXSRFTokenCondition(newConfig, withXSRFToken) {
  if (utils.isFunction(withXSRFToken)) {
    withXSRFToken = withXSRFToken(newConfig);
  }
  
  return withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url));
}

export async function resolveConfigAsync(config) {
  const { newConfig, data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = initializeConfig(config);

  // Handle HTTP basic authentication
  handleAuthentication(headers, auth);

  // Handle FormData
  handleFormData(data, headers);

  // Add xsrf header
  // This is only done if running in a standard browser environment.
  // Specifically not if we're in a web worker, or react-native.

  if (platform.hasStandardBrowserEnv) {
    if (handleXSRFTokenCondition(newConfig, withXSRFToken)) {
      // Add xsrf header - now async
      if (xsrfHeaderName && xsrfCookieName) {
        const xsrfValue = await asyncCookies.read(xsrfCookieName);

        if (xsrfValue) {
          headers.set(xsrfHeaderName, xsrfValue);
        }
      }
    }
  }

  return newConfig;
}

export default (config) => {
  const { newConfig, data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = initializeConfig(config);

  // Handle HTTP basic authentication
  handleAuthentication(headers, auth);

  // Handle FormData
  handleFormData(data, headers);

  // Add xsrf header
  // This is only done if running in a standard browser environment.
  // Specifically not if we're in a web worker, or react-native.

  if (platform.hasStandardBrowserEnv) {
    if (handleXSRFTokenCondition(newConfig, withXSRFToken)) {
      // Add xsrf header - synchronous version
      const xsrfValue = xsrfHeaderName && xsrfCookieName && syncCookies.read(xsrfCookieName);

      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }

  return newConfig;
}