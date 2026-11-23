// Resolves the proxy for a URL from the standard proxy environment variables.
// Adapted from proxy-from-env 2.1.0 (https://github.com/Rob--W/proxy-from-env).
// A variable that is not set on process.env itself is ignored when
// Object.prototype has a property of the same name, so a polluted prototype
// cannot choose the proxy or skip it. The port of a URL object is also read as
// a decimal number, which matches every port the URL parser produces.
//
// proxy-from-env is distributed under the MIT License:
//
// Copyright (C) 2016-2018 Rob Wu <rob@robwu.nl>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import utils from '../utils.js';

const DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
};

const parseUrl = (urlString) => {
  try {
    return new URL(urlString);
  } catch (_err) {
    return null;
  }
};

/**
 * Read one environment variable without trusting Object.prototype.
 *
 * A name that is not set on process.env itself is ignored when Object.prototype
 * has a property of the same name. Any other name is read as usual, so an env
 * object that a test runner replaces or wraps keeps working.
 *
 * @param {string} name The exact name of the environment variable.
 * @returns {string|undefined} The value, or undefined when it must not be used.
 */
const readEnv = (name) => {
  const env = process.env;

  if (utils.hasOwnProp(env, name) || !(name in Object.prototype)) {
    return env[name];
  }

  return undefined;
};

/**
 * Get the value of an environment variable, preferring the lower-case name.
 *
 * @param {string} key The name of the environment variable.
 * @returns {string} The value, or an empty string when it is not set.
 */
export const getEnv = (key) => readEnv(key.toLowerCase()) || readEnv(key.toUpperCase()) || '';

/**
 * Determine whether a request to the given host and port should be proxied,
 * based on the no_proxy variable.
 *
 * @param {string} hostname The host name of the URL, with IPv6 brackets kept.
 * @param {number} port The effective port of the URL.
 * @returns {boolean} Whether the request should be proxied.
 */
const shouldProxy = (hostname, port) => {
  const noProxy = getEnv('no_proxy').toLowerCase();

  if (!noProxy) {
    return true;
  }

  if (noProxy === '*') {
    return false;
  }

  return noProxy.split(/[,\s]/).every((entry) => {
    if (!entry) {
      return true;
    }

    const parsedEntry = entry.match(/^(.+):(\d+)$/);
    let entryHostname = parsedEntry ? parsedEntry[1] : entry;
    const entryPort = parsedEntry ? Number.parseInt(parsedEntry[2], 10) : 0;

    if (entryPort && entryPort !== port) {
      return true;
    }

    if (!/^[.*]/.test(entryHostname)) {
      return hostname !== entryHostname;
    }

    if (entryHostname.charAt(0) === '*') {
      entryHostname = entryHostname.slice(1);
    }

    return !hostname.endsWith(entryHostname);
  });
};

/**
 * Get the proxy URL that should handle a request to the given URL.
 *
 * @param {string|URL|Object} url The request URL, or a URL-like object.
 * @returns {string} The proxy URL, or an empty string when no proxy applies.
 */
export const getProxyForUrl = (url) => {
  const parsedUrl = (typeof url === 'string' ? parseUrl(url) : url) || {};
  let proto = parsedUrl.protocol;
  let hostname = parsedUrl.host;
  let port = parsedUrl.port;

  if (typeof hostname !== 'string' || !hostname || typeof proto !== 'string') {
    return '';
  }

  proto = proto.split(':', 1)[0];
  // Strip the port this way rather than using parsedUrl.hostname so the
  // brackets around IPv6 addresses are kept.
  hostname = hostname.replace(/:\d*$/, '');
  port = Number.parseInt(port, 10) || DEFAULT_PORTS[proto] || 0;

  if (!shouldProxy(hostname, port)) {
    return '';
  }

  let proxy = getEnv(proto + '_proxy') || getEnv('all_proxy');

  if (proxy && proxy.indexOf('://') === -1) {
    // No scheme in the proxy value: default to the request URL's scheme.
    proxy = proto + '://' + proxy;
  }

  return proxy;
};
