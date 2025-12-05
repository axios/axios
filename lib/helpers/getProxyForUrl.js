'use strict';

/**
 * Default ports for common protocols
 */
const DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
};

/**
 * Get the value for an environment variable.
 * Checks both lowercase and uppercase variants.
 *
 * @param {string} key - The name of the environment variable.
 * @return {string} The value of the environment variable.
 * @private
 */
function getEnv(key) {
  return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || '';
}

/**
 * Determines whether a given URL should be proxied.
 *
 * @param {string} hostname - The host name of the URL.
 * @param {number} port - The effective port of the URL.
 * @returns {boolean} Whether the given URL should be proxied.
 * @private
 */
function shouldProxy(hostname, port) {
  const NO_PROXY = (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();
  
  if (!NO_PROXY) {
    return true; 
  }
  
  if (NO_PROXY === '*') {
    return false;
  }

  return NO_PROXY.split(/[,\s]/).every(function(proxy) {
    if (!proxy) {
      return true;
    }
    
    const parsedProxy = proxy.match(/^(.+):(\d+)$/);
    let parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    const parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
    
    if (parsedProxyPort && parsedProxyPort !== port) {
      return true;
    }

    if (!/^[.*]/.test(parsedProxyHostname)) {
      // No wildcards, so stop proxying if there is an exact match.
      return hostname !== parsedProxyHostname;
    }

    if (parsedProxyHostname.charAt(0) === '*') {
      // Remove leading wildcard.
      parsedProxyHostname = parsedProxyHostname.slice(1);
    }
    
    return !hostname.endsWith(parsedProxyHostname);
  });
}

/**
 * Get the proxy URL for a given URL, respecting environment variables.
 * This is a WHATWG URL API-based implementation that replaces the deprecated
 * url.parse() usage from the proxy-from-env package.
 *
 * @param {string|URL} url - The URL, or a URL object.
 * @return {string} The URL of the proxy that should handle the request to the
 *  given URL. If no proxy is set, this will be an empty string.
 */
export default function getProxyForUrl(url) {
  let parsedUrl;
  
  try {
    parsedUrl = typeof url === 'string' ? new URL(url) : url;
  } catch (e) {
    return '';
  }
  
  const proto = parsedUrl.protocol.replace(':', '');
  let hostname = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port) : DEFAULT_PORTS[proto] || 0;
  
  if (!hostname || !proto) {
    return '';
  }
  
  if (!shouldProxy(hostname, port)) {
    return '';
  }

  const proxy =
    getEnv('npm_config_' + proto + '_proxy') ||
    getEnv(proto + '_proxy') ||
    getEnv('npm_config_proxy') ||
    getEnv('all_proxy');
    
  if (proxy && proxy.indexOf('://') === -1) {
    // Missing scheme in proxy, default to the requested URL's scheme.
    return proto + '://' + proxy;
  }
  
  return proxy;
}
