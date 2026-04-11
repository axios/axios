'use strict';

var utils = require('../utils');

var INVALID_HEADER_VALUE_RE = /[^\x09\x20-\x7E\x80-\xFF]/g;
var BOUNDARY_WHITESPACE_RE = /^[\x09\x20]+|[\x09\x20]+$/g;

function sanitizeHeaderValue(value) {
  if (value === false || value == null) {
    return value;
  }

  if (utils.isArray(value)) {
    return value.map(sanitizeHeaderValue);
  }

  return String(value)
    .replace(INVALID_HEADER_VALUE_RE, '')
    .replace(BOUNDARY_WHITESPACE_RE, '');
}

module.exports = sanitizeHeaderValue;
