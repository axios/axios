'use strict';

var merge = require('./merge');

var toString = Object.prototype.toString;
var JSON_START = /^\s*(\[|\{[^\{])/;
var JSON_END = /[\}\]]\s*$/;
var PROTECTION_PREFIX = /^\)\]\}',?\n/;
var CONTENT_TYPE_APPLICATION_JSON = {
  'Content-Type': 'application/json;charset=utf-8'
};

module.exports = {
  transformRequest: [function (data) {
    return data !== null && typeof data === 'object' &&
          toString.call(data) !== '[object File]' &&
          toString.call(data) !== '[object Blob]' ?
            JSON.stringify(data) : null;
  }],

  transformResponse: [function (data) {
    if (typeof data === 'string') {
      data = data.replace(PROTECTION_PREFIX, '');
      if (JSON_START.test(data) && JSON_END.test(data)) {
        data = JSON.parse(data);
      }
    }
    return data;
  }],

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    },
    patch: merge(CONTENT_TYPE_APPLICATION_JSON),
    post: merge(CONTENT_TYPE_APPLICATION_JSON),
    put: merge(CONTENT_TYPE_APPLICATION_JSON)
  },

  xsrfCookiName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
};