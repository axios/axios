'use strict';

import utils from './../utils.js';
import defaults from '../defaults/index.js';
import AxiosHeaders from '../core/AxiosHeaders.js';

/**
 * Transforms the data for a request or a response using the provided functions.
 *
 * @param {Array|Function} fns - A single function or an array of functions to apply to the data.
 * @param {?Object} response - The response object to use for the transformation.
 *
 * @returns {*} The resulting transformed data.
 */
export default function transformData(fns, response) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders.from(context.headers);
  let data = context.data;

  utils.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
  });

  headers.normalize();

  return data;
}
