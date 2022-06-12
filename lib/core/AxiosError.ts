'use strict';

import { AxiosRequestConfig, AxiosResponse } from 'index';
import * as utils from '../utils'

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
export default class AxiosError extends Error {
  code?: string
  config?: AxiosRequestConfig
  request?: any
  response?: AxiosResponse

  constructor(message: string = '', code?: string, config?: AxiosRequestConfig, request?: any, response?: AxiosResponse) {
    super()

    this.message = message;
    this.name = 'AxiosError';
    utils.isUndefined(code) && (this.code = code)
    utils.isUndefined(config) && (this.config = config)
    utils.isUndefined(request) && (this.request = request)
    utils.isUndefined(response) && (this.response = response)

    if (Error.captureStackTrace) {
      Error.captureStackTrace?.(this, this.constructor)
    } else {
      this.stack = (new Error()).stack;
    }
  }

  static from(error: Error, code?: string, config?: AxiosRequestConfig, request?: any, response?: AxiosResponse, customProps?: Record<keyof any, any>) {
    const axiosError = Object.create(prototype) as AxiosError;

    utils.toFlatObject(error, axiosError, (obj: any) => obj !== Error.prototype);

    AxiosError.call(axiosError, error.message, code, config, request, response);

    axiosError.cause = error;

    axiosError.name = error.name;

    customProps && Object.assign(axiosError, customProps);

    return axiosError;
  };

  toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      // @ts-expect-error
      description: this.description,
      // @ts-expect-error 
      number: this.number,
      // Mozilla
      // @ts-expect-error 
      fileName: this.fileName,
      // @ts-expect-error 
      lineNumber: this.lineNumber,
      // @ts-expect-error 
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    }
  }
}

const prototype = AxiosError.prototype;
const descriptorsNames = [
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
];
const descriptors: Record<string, PropertyDescriptor> = {};

descriptorsNames.forEach(function (code) {
  descriptors[code] = { value: code };
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', { value: true });
