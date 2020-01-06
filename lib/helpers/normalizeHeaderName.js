/**
 * 规范化头部名称函数
 * @param headers
 * @param normalizedName
 */

'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName (headers, normalizedName) {
    utils.forEach(headers, function processHeader (value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
            headers[normalizedName] = value;
            delete headers[name];
        }
    });
};
