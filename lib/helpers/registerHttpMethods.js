'use strict';

var utils = require('../utils');
var bind = require('./bind');

/**
 * Method to register http methods as instance function on certain axios objects.
 *
 * @param {Array.<string>} methods
 * @param {boolean} withBody
 * @param {Object} axios
 * @param {Object} prototype
 * @param {Object} defaultInstance
 * @returns {void}
 *
 * @author Maximilian Bosch <maximilian.bosch.27@gmail.com>
 */
module.exports = function registerHttpMethods(methods, withBody, axios, prototype, defaultInstance) {
  methods.forEach(function attachMethod(method) {
    /*eslint func-names:0*/
    function methodWithoutBody(url, config) {
      return this.request(utils.merge(config || {}, {
        method: method,
        url: url
      }));
    }

    function methodWithBody(url, data, config) {
      return this.request(utils.merge(config || {}, {
        method: method,
        url: url,
        data: data
      }));
    }

    var callback = withBody ? methodWithBody : methodWithoutBody;
    if (!prototype || !defaultInstance) {
      axios[method] = callback;
    } else {
      prototype[method] = callback;
      axios[method] = bind(prototype[method], defaultInstance);
    }
  });
};
