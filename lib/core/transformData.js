'use strict';

var utils = require('./../utils');
var defaults = require('../defaults');
var AxiosHeaders = require('../core/AxiosHeaders');

/**
 * Transform the data for a request or a response
 *
 * @param {Array|Function} fns A single function or Array of functions
 * @param {?Object} response The response object
 *
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(fns, response) {
  var config = this || defaults;
  var context = response || config;
  var headers = AxiosHeaders.from(context.headers);
  var data = context.data;

  utils.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
  });

  headers.normalize();

  return data;
};
