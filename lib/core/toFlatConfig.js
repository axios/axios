'use strict';

var mergeConfig = require('./mergeConfig');

var objectPrototype = Object.prototype;

/**
 * resolves deep prototype-based config chain to its flat representation
 * @param {Object} sourceConfig prototype-based config chain
 * @returns {Object} flat config representation
 */

module.exports = function toFlatConfig(sourceConfig) {
  var flatConfig = {};
  var target = sourceConfig;
  var targets = new Array(10);
  var i = 0;

  do {
    targets[i++] = target;
  } while ((target = Object.getPrototypeOf(target)) && target !== objectPrototype);

  while (i-- > 0) {
    mergeConfig(flatConfig, targets[i], flatConfig);
  }

  return flatConfig;
};
