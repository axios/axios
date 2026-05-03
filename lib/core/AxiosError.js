'use strict';

var utils = require('../utils');
var DEFAULT_REDACT_KEYS = require('../helpers/defaultRedactKeys');

var REDACTED_VALUE = '[REDACTED ****]';

function makeValueDescriptor(value) {
  var descriptor = Object.create(null);
  descriptor.value = value;
  return descriptor;
}

function getRedactKeys(config) {
  // An empty array is treated as "no override" so an upstream `redact: []` cannot
  // silently disable redaction. To opt out, pass non-string values or unset keys.
  var override = config && utils.isArray(config.redact) && config.redact.length ? config.redact : null;
  var redact = override || DEFAULT_REDACT_KEYS;
  var keys = {};

  utils.forEach(redact, function eachRedactKey(key) {
    if (typeof key === 'string') {
      keys[key.toLowerCase()] = true;
    }
  });

  return keys;
}

function shouldRedact(key, keys) {
  return typeof key === 'string' && keys[key.toLowerCase()];
}

var CIRCULAR_VALUE = '[Circular]';

function serializeConfigValue(value, keys, key, seen) {
  var result;

  if (shouldRedact(key, keys)) {
    return REDACTED_VALUE;
  }

  if (utils.isArray(value)) {
    if (seen.indexOf(value) !== -1) {
      return CIRCULAR_VALUE;
    }
    seen.push(value);
    result = [];
    utils.forEach(value, function eachArrayValue(item, index) {
      result[index] = serializeConfigValue(item, keys, index, seen);
    });
    seen.pop();
    return result;
  }

  if (utils.isPlainObject(value)) {
    if (seen.indexOf(value) !== -1) {
      return CIRCULAR_VALUE;
    }
    seen.push(value);
    result = {};
    utils.forEach(value, function eachObjectValue(item, itemKey) {
      result[itemKey] = serializeConfigValue(item, keys, itemKey, seen);
    });
    seen.pop();
    return result;
  }

  return value;
}

function serializeConfig(config) {
  if (!config) {
    return config;
  }

  return serializeConfigValue(config, getRedactKeys(config), undefined, []);
}

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = (new Error()).stack;
  }

  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}

utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: serializeConfig(this.config),
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

var prototype = AxiosError.prototype;
var descriptors = Object.create(null);

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL',
  'ERR_FORM_DATA_DEPTH_EXCEEDED'
// eslint-disable-next-line func-names
].forEach(function(code) {
  descriptors[code] = makeValueDescriptor(code);
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', makeValueDescriptor(true));

// eslint-disable-next-line func-names
AxiosError.from = function(error, code, config, request, response, customProps) {
  var axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.cause = error;

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

module.exports = AxiosError;
