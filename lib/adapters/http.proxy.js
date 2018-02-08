'use strict';

var url = require('url');

var getProxyForUrl = require('proxy-from-env').getProxyForUrl;

/**
 *
 * @param {Object} config
 * @param {string} config.url
 * @param {Object=) config.proxy
 * @param {string} config.proxy.host
 * @param {number} config.proxy.port
 * @return {object | undefined} proxy
 * @return {string} proxy.host
 * @return {number} proxy.number
 * @return {object | undefined} proxy.auth
 * @return {string} proxy.auth.username
 * @return {string} proxy.auth.password
 */
module.exports = function getProxy(config) {
  var proxy = config.proxy;
  if (!proxy && proxy !== false) {
    var envProxy = getProxyForUrl(config.url);
    if (envProxy) {
      var parsedProxyUrl = url.parse(envProxy);
      proxy = {
        host: parsedProxyUrl.hostname,
        port: parsedProxyUrl.port
      };

      if (parsedProxyUrl.auth) {
        var proxyUrlAuth = parsedProxyUrl.auth.split(':');
        proxy.auth = {
          username: proxyUrlAuth[0],
          password: proxyUrlAuth[1]
        };
      }
    }
  }
  return proxy || undefined;
};
