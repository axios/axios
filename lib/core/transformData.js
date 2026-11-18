'use strict';

import utils from '../utils.js';
import defaults from '../defaults/index.js';
import AxiosHeaders from '../core/AxiosHeaders.js';

/**
 * Transform the data for a request or a response
 *
 * @param {Array|Function} fns A single function or Array of functions
 * @param {?Object} response The response object
 *
 * @returns {*} The resulting transformed data
 */
export default function transformData(fns, response, beforeAsyncTransform) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders.from(context.headers);
  let data = context.data;

  let pending;

  utils.forEach(fns, function transform(fn) {
    const apply = (value) =>
      fn.call(config, value, headers.normalize(), response ? response.status : undefined);

    if (pending) {
      pending = pending.then((value) => {
        // Stop subsequent request-transform work after cancellation or timeout.
        beforeAsyncTransform && beforeAsyncTransform();
        return apply(value);
      });
      return;
    }

    const transformed = apply(data);

    // Only request transforms may be asynchronous. Preserve the synchronous
    // response transform contract, including response data that is a Promise.
    if (!response && transformed != null && typeof transformed.then === 'function') {
      pending = Promise.resolve(transformed);
    } else {
      data = transformed;
    }
  });

  if (pending) {
    return pending.then((value) => {
      headers.normalize();
      return value;
    });
  }

  headers.normalize();

  return data;
}
