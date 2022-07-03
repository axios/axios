'use strict';

import { AxiosRequestConfig, AxiosResponse } from 'index';
import * as utils from '../utils'

export default interface AxiosError<T = unknown, D = any> extends Error {
  code?: string
  config?: AxiosRequestConfig<D>,
  request?: any
  response?: AxiosResponse<T, D>

  readonly isAxiosError: true
}

export interface AxiosErrorConstructor<T = unknown, D = any> extends ErrorConstructor {
  new(message?: string, config?: AxiosRequestConfig, code?: string, request?: any, response?: AxiosResponse): AxiosError
  (message?: string): AxiosError

  readonly ERR_BAD_OPTION_VALUE: 'ERR_BAD_OPTION_VALUE'
  readonly ERR_BAD_OPTION: 'ERR_BAD_OPTION'
  readonly ECONNABORTED: 'ECONNABORTED'
  readonly ETIMEDOUT: 'ETIMEDOUT'
  readonly ERR_NETWORK: 'ERR_NETWORK'
  readonly ERR_FR_TOO_MANY_REDIRECTS: 'ERR_FR_TOO_MANY_REDIRECTS'
  readonly ERR_DEPRECATED: 'ERR_DEPRECATED'
  readonly ERR_BAD_RESPONSE: 'ERR_BAD_RESPONSE'
  readonly ERR_BAD_REQUEST: 'ERR_BAD_REQUEST'
  readonly ERR_CANCELED: 'ERR_CANCELED'
  readonly ERR_NOT_SUPPORT: 'ERR_NOT_SUPPORT'
  readonly ERR_INVALID_URL: 'ERR_INVALID_URL'

  from: (error: Error, code?: string, config?: AxiosRequestConfig, request?: any, response?: AxiosResponse, customProps?: Record<keyof any, any>) => AxiosError

  readonly prototype: AxiosError<T, D>
}

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
export default class AxiosError<T = unknown, D = any> extends Error {
  static readonly ERR_BAD_OPTION_VALUE = 'ERR_BAD_OPTION_VALUE'
  static readonly ERR_BAD_OPTION = 'ERR_BAD_OPTION'
  static readonly ECONNABORTED = 'ECONNABORTED'
  static readonly ETIMEDOUT = 'ETIMEDOUT'
  static readonly ERR_NETWORK = 'ERR_NETWORK'
  static readonly ERR_FR_TOO_MANY_REDIRECTS = 'ERR_FR_TOO_MANY_REDIRECTS'
  static readonly ERR_DEPRECATED = 'ERR_DEPRECATED'
  static readonly ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE'
  static readonly ERR_BAD_REQUEST = 'ERR_BAD_REQUEST'
  static readonly ERR_CANCELED = 'ERR_CANCELED'
  static readonly ERR_NOT_SUPPORT = 'ERR_NOT_SUPPORT'
  static readonly ERR_INVALID_URL = 'ERR_INVALID_URL'

  static from(error: Error, code?: string, config?: AxiosRequestConfig, request?: any, response?: AxiosResponse, customProps?: Record<keyof any, any>) {
    const axiosError = Object.create(AxiosError.prototype);

    utils.toFlatObject(error, axiosError, (obj: any) => obj !== Error.prototype);

    AxiosError.call(axiosError, error.message, code, config, request, response);

    axiosError.cause = error;

    axiosError.name = error.name;

    customProps && Object.assign(axiosError, customProps);

    return axiosError;
  };

  code?: string
  config?: AxiosRequestConfig<D>
  request?: any
  response?: AxiosResponse<T, D>

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

Object.defineProperty(AxiosError.prototype, 'isAxiosError', { value: true });
