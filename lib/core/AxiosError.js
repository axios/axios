'use strict';

import utils from '../utils.js';

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 *
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  /*
  Creating an error that is a native error, instance of error and has a good stack trace is
  hard if you don't want to use class syntax. So this should probably be rewritten as a class.
   */

  let instance;
  // Error.captureStackTrace only exists in V8.
  if (Error.captureStackTrace) {
    /* We store the stack trace limit because we want to set it to zero later to
    initialize the error without a stack trace. Computing stack traces is expensive.
    */
    const { stackTraceLimit } = Error
    Error.stackTraceLimit = 0
    instance = new Error();
    Error.stackTraceLimit = stackTraceLimit;
    // captureStackTrace() computes a new stack trace that does not contain this constructor
    Error.captureStackTrace(instance, AxiosError);
  } else {
    instance = new Error();
  }

  instance.message = message;
  instance.name = 'AxiosError';
  code && (instance.code = code);
  config && (instance.config = config);
  request && (instance.request = request);
  response && (instance.response = response);
  return instance;
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
      config: utils.toJSONObject(this.config),
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

const prototype = AxiosError.prototype;
const descriptors = {};

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
  'ERR_INVALID_URL'
// eslint-disable-next-line func-names
].forEach(code => {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  }, prop => {
    return prop !== 'isAxiosError';
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.cause = error;

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

export default AxiosError;
