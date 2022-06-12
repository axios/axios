'use strict';

import type { AxiosInterceptorOptions, AxiosRequestConfig } from 'index';
import * as utils from './../utils'

export type Interceptor<V> = {
  fulfilled?: (value: V) => any | Promise<any>
  rejected?: (error: any) => any
  synchronous?: boolean
  runWhen?: (config: AxiosRequestConfig) => boolean
} | null

export class InterceptorManager<V> {
  handlers: Interceptor<V>[];

  constructor() {
    this.handlers = []
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use<T = V>(fulfilled?: (value: V) => T | Promise<T>, rejected?: (error: any) => any, options: AxiosInterceptorOptions = {}): number {
    const {
      synchronous = false,
      runWhen = void 0,
    } = options

    this.handlers.push({
      fulfilled,
      rejected,
      synchronous,
      runWhen,
    });

    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id: number) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn: Function) {
    utils.forEach(this.handlers, (h) => {
      h !== null && fn(h);
    });
  }
}
