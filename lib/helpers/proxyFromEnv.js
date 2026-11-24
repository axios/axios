'use strict';

// Resolves the proxy for a URL from the standard proxy environment variables.
// Adapted from proxy-from-env 1.1.0 (https://github.com/Rob--W/proxy-from-env).
// A variable that is not set on process.env itself is ignored when
// Object.prototype has a property of the same name, so a polluted prototype
// cannot choose the proxy or skip it. The port of a parsed URL object is also
// read as a decimal number, which matches every port url.parse produces.
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

var parseUrl = require('url').parse;
var utils = require('./../utils');

var DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
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
function readEnv(name) {
  var env = process.env;

  if (utils.hasOwnProperty(env, name) || !(name in Object.prototype)) {
    return env[name];
  }

  return undefined;
}

/**
 * Get the value of an environment variable, preferring the lower-case name.
 *
 * @param {string} key The name of the environment variable.
 * @returns {string} The value, or an empty string when it is not set.
 */
function getEnv(key) {
  return readEnv(key.toLowerCase()) || readEnv(key.toUpperCase()) || '';
}

function shouldProxy(hostname, port) {
  var noProxy = (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();

  if (!noProxy) {
    return true;
  }

  if (noProxy === '*') {
    return false;
  }

  return noProxy.split(/[,\s]/).every(function testEntry(entry) {
    if (!entry) {
      return true;
    }

    var parsedEntry = entry.match(/^(.+):(\d+)$/);
    var entryHostname = parsedEntry ? parsedEntry[1] : entry;
    var entryPort = parsedEntry ? parseInt(parsedEntry[2], 10) : 0;

    if (entryPort && entryPort !== port) {
      return true;
    }

    if (!/^[.*]/.test(entryHostname)) {
      return hostname !== entryHostname;
    }

    if (entryHostname.charAt(0) === '*') {
      entryHostname = entryHostname.slice(1);
    }

    return !utils.endsWith(hostname, entryHostname);
  });
}

/**
 * Get the proxy URL that should handle a request to the given URL.
 *
 * @param {string|Object} location The request URL, or the result of url.parse.
 * @returns {string} The proxy URL, or an empty string when no proxy applies.
 */
function getProxyForUrl(location) {
  var parsedUrl = typeof location === 'string' ? parseUrl(location) : location || {};
  var proto = parsedUrl.protocol;
  var hostname = parsedUrl.host;
  var port = parsedUrl.port;

  if (typeof hostname !== 'string' || !hostname || typeof proto !== 'string') {
    return '';
  }

  proto = proto.split(':', 1)[0];
  // Strip the port this way rather than using parsedUrl.hostname so the
  // brackets around IPv6 addresses are kept.
  hostname = hostname.replace(/:\d*$/, '');
  port = parseInt(port, 10) || DEFAULT_PORTS[proto] || 0;

  if (!shouldProxy(hostname, port)) {
    return '';
  }

  var proxy =
    getEnv('npm_config_' + proto + '_proxy') ||
    getEnv(proto + '_proxy') ||
    getEnv('npm_config_proxy') ||
    getEnv('all_proxy');

  if (proxy && proxy.indexOf('://') === -1) {
    // No scheme in the proxy value: default to the request URL's scheme.
    proxy = proto + '://' + proxy;
  }

  return proxy;
}

module.exports = {
  getProxyForUrl: getProxyForUrl,
  getEnv: getEnv
};
