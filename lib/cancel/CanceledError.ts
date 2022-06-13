'use strict';

import { AxiosRequestConfig } from 'index';
import type { AxiosErrorConstructor } from '../core/AxiosError';
import AxiosError from '../core/AxiosError';


export interface CanceledErrorConstructor<T = unknown, D = any> extends AxiosErrorConstructor<T, D> {
  readonly prototype: CanceledError<T, D>;
}

export default interface CanceledError<T = unknown, D = any> extends AxiosError<T, D> {
  readonly __CANCEL__: true;
}

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @param {string=} message The message.
 * @param {Object=} config The config.
 * @param {Object=} request The request.
 *
 * @returns {CanceledError} The created error.
 */
export default class CanceledError<T = unknown, D = any> extends AxiosError<T, D> {
  constructor(message: string = 'canceled', config?: AxiosRequestConfig, request?: any) {
    super(message, AxiosError.ERR_CANCELED, config, request)
  }
}

Object.defineProperty(CanceledError.prototype, '__CANCEL__', { value: true });
