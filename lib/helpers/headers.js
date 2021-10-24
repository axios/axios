'use strict';

var utils = require('../utils');

/**
 * Headers class helper to work with case insensitive headers
 * @param {Object} headers
 * @param {Array|String|Object} [schema] The schema that will be used for headers normalizing and or setting default values.
 * @constructor
 */

function Headers(headers, schema) {
  this.headers = {};
  this.names = {};
  var context = this;
  this.list = {};

  if (schema) {
    if (utils.isPlainObject(schema)) {
      utils.forEach(typeof schema === 'string' ? schema.split(' ') : schema, function each(value, header) {
        if (!header) return;
        context.list[header.toLowerCase()] = header;
        context.set(header, value);
      });
    } else {
      schema && (utils.isArray(schema) ? schema : schema.split(' ')).forEach(function each(targetHeader) {
        targetHeader && (context.list[targetHeader.toLowerCase()] = targetHeader);
      });
    }
  }

  headers && utils.forEach(headers, function each(value, header) {
    context.set(header, value);
  });
}

Object.assign(Headers.prototype, {
  set: function set(header, value, rewrite) {
    // eslint-disable-next-line no-param-reassign
    rewrite = utils.isUndefined(rewrite) ? true : rewrite;
    var loHeader = header.toLowerCase();
    var existingHeader = this.names[loHeader];

    if (existingHeader && value === null) {
      delete this.headers[existingHeader];
      delete this.names[loHeader];
      return null;
    }
    // eslint-disable-next-line no-param-reassign
    header = existingHeader || (this.names[loHeader] = this.list[loHeader] || header);

    if (!utils.isUndefined(value) && (rewrite || utils.isUndefined(this.headers[header]))) {
      this.headers[header] = value;
    }
    return value;
  },

  has: function has(header) {
    return this.names[header.toLowerCase()] || false;
  },

  get: function get(header, defaultValueToSet) {
    var originalName = this.names[header.toLowerCase()];
    var value = this.headers[originalName];
    if (!utils.isUndefined(defaultValueToSet) && utils.isUndefined(value)) {
      this.set(header, defaultValueToSet);
      return defaultValueToSet;
    }
    return value;
  },

  toJSON: function toJSON() {
    return Object.assign({}, this.headers);
  }
});

module.exports = Headers;
