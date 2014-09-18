'use strict';

var utils = require('./utils');

var JSON_START = /^\s*(\[|\{[^\{])/;
var JSON_END = /[\}\]]\s*$/;
var PROTECTION_PREFIX = /^\)\]\}',?\n/;
var CONTENT_TYPE_APPLICATION_JSON = {
  'Content-Type': 'application/json;charset=utf-8'
};

module.exports = {
  transformRequest: [function (data) {
    if (utils.isArrayBuffer(data)) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isObject(data) && !utils.isFile(data) && !utils.isBlob(data)) {
      return JSON.stringify(data);
    }
    return data;
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
    patch: utils.merge(CONTENT_TYPE_APPLICATION_JSON),
    post: utils.merge(CONTENT_TYPE_APPLICATION_JSON),
    put: utils.merge(CONTENT_TYPE_APPLICATION_JSON)
  },

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
};