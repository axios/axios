'use strict';

var forEach = require('./forEach');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+');
}

module.exports = function buildUrl(url, params) {
  if (!params) {
    return url;
  }

  var parts = [];

  forEach(params, function (val, key) {
    if (val === null || typeof val === 'undefined') {
      return;
    }
    if (Object.prototype.toString.call(val) !== '[object Array]') {
      val = [val];
    }

    forEach(val, function (v) {
      if (Object.prototype.toString.call(v) === '[object Date]') {
        v = v.toISOString();
      }
      else if (typeof v === 'object') {
        v = JSON.stringify(v);
      }
      parts.push(encode(key) + '=' + encode(v));
    });
  });

  if (parts.length > 0) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
  }

  return url;
};