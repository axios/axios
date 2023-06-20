'use strict';

import utils from '../utils.js';
import parseHeaders from '../helpers/parseHeaders.js';

const $internals = Symbol('internals');

function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }

  return utils.isArray(value) ? value.map(normalizeValue) : String(value);
}

/**
 * Parses a string into an object of tokens.
 * @param {string} str - The string to parse.
 * @returns {Object} - An object containing the parsed tokens.
 */
function parseTokens(str) {
  const tokens = Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;

  while ((match = tokensRE.exec(str))) {
    tokens[match[1]] = match[2];
  }

  return tokens;
}

const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

/**
 * Matches a header value against a filter.
 * @param {object} context - The context object.
 * @param {string} value - The header value to match.
 * @param {string} header - The header name.
 * @param {string|RegExp|Function} filter - The filter to apply.
 * @param {boolean} isHeaderNameFilter - Whether the filter applies to the header name instead of the value.
 * @returns {boolean} - Whether the header value matches the filter.
 */
function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
  if (utils.isFunction(filter)) {
    return filter.call(this, value, header);
  }

  if (isHeaderNameFilter) {
    value = header;
  }

  if (!utils.isString(value)) return;

  if (utils.isString(filter)) {
    return value.indexOf(filter) !== -1;
  }

  if (utils.isRegExp(filter)) {
    return filter.test(value);
  }
}

function formatHeader(header) {
  return header.trim()
    .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
}

/**
 * Builds accessors for an object based on a given header.
 * @param {object} obj - The object to build accessors for.
 * @param {string} header - The header to base the accessor names on.
 */
function buildAccessors(obj, header) {
  const accessorName = utils.toCamelCase(' ' + header);

  ['get', 'set', 'has'].forEach(methodName => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}

/**
 * Class representing HTTP headers for Axios requests.
 * @class
 */
class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }

  /**
   * Sets a header value or rewrites an existing header.
   * @param {string|object} header - The header name or an object containing header names and values.
   * @param {*} valueOrRewrite - The value to set if `header` is a string, or a boolean indicating whether to rewrite an existing header.
   * @param {boolean} [rewrite] - Optional boolean indicating whether to rewrite an existing header.
   * @returns {this} The current instance of the class.
   */
  set(header, valueOrRewrite, rewrite) {
    const self = this;

    /**
     * Sets the value of a header in the current object.
     * @param _value - The value to set for the header.
     * @param _header - The name of the header to set.
     * @param _rewrite - Optional. If true, the header will be overwritten even if it already exists. If false, the header will not be overwritten. If undefined, the header will be overwritten if it does not already exist.
     * @throws Error if the header name is not a non-empty string.
     */
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      const key = utils.findKey(self, lHeader);

      if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
        self[key || _header] = normalizeValue(_value);
      }
    }

    const setHeaders = (headers, _rewrite) =>
      utils.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

    if (utils.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite)
    } else if(utils.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }

    return this;
  }

  /**
   * Retrieves the value of a header from the current instance.
   * @param {string} header - The header to retrieve.
   * @param {boolean|RegExp|function} [parser] - Optional parser to apply to the header value.
   * @returns {*} The value of the header, optionally parsed by the specified parser.
   */
  get(header, parser) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils.findKey(this, header);

      if (key) {
        const value = this[key];

        if (!parser) {
          return value;
        }

        if (parser === true) {
          return parseTokens(value);
        }

        if (utils.isFunction(parser)) {
          return parser.call(this, value, key);
        }

        if (utils.isRegExp(parser)) {
          return parser.exec(value);
        }

        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }

  /**
   * Checks if the provided header exists in the current object and matches the provided matcher.
   * @param {string} header - The header to check.
   * @param {string} [matcher] - The matcher to use for checking the header value.
   * @returns {boolean} - Returns true if the header exists and matches the matcher, false otherwise.
   */
  has(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils.findKey(this, header);

      return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }

    return false;
  }

  /**
   * Deletes a header from the current instance.
   * @param {string | string[]} header - The header(s) to delete.
   * @param {Function} matcher - A function to match the header value.
   * @returns {boolean} - Returns true if the header was deleted, false otherwise.
   */
  delete(header, matcher) {
    const self = this;
    let deleted = false;

    /**
     * Deletes a header from the object.
     * @param {string} _header - The header to be deleted.
     */
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);

      if (_header) {
        const key = utils.findKey(self, _header);

        if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
          delete self[key];

          deleted = true;
        }
      }
    }

    if (utils.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }

    return deleted;
  }

  /**
   * Clears properties from the current object based on a provided matcher function.
   * @param {Function} matcher - A function that takes in a value and returns a boolean indicating whether the value should be deleted.
   * @returns {boolean} - Returns true if any properties were deleted, false otherwise.
   */
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;

    while (i--) {
      const key = keys[i];
      if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }

    return deleted;
  }

  /**
   * Normalizes the headers of the current object instance.
   * @param {string} format - The format to use for normalization.
   * @returns {Object} - The current object instance with normalized headers.
   */
  normalize(format) {
    const self = this;
    const headers = {};

    utils.forEach(this, (value, header) => {
      const key = utils.findKey(headers, header);

      if (key) {
        self[key] = normalizeValue(value);
        delete self[header];
        return;
      }

      const normalized = format ? formatHeader(header) : String(header).trim();

      if (normalized !== header) {
        delete self[header];
      }

      self[normalized] = normalizeValue(value);

      headers[normalized] = true;
    });

    return this;
  }

  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }

  toJSON(asStrings) {
    const obj = Object.create(null);

    utils.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils.isArray(value) ? value.join(', ') : value);
    });

    return obj;
  }

  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }

  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
  }

  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }

  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }

  static concat(first, ...targets) {
    const computed = new this(first);

    targets.forEach((target) => computed.set(target));

    return computed;
  }

  /**
   * Defines accessors for the provided header.
   * @param {string | string[]} header - The header(s) to define accessors for.
   * @returns {typeof MyClass} - Returns the class itself.
   */
  static accessor(header) {
    const internals = this[$internals] = (this[$internals] = {
      accessors: {}
    });

    const accessors = internals.accessors;
    const prototype = this.prototype;

    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);

      if (!accessors[lHeader]) {
        buildAccessors(prototype, _header);
        accessors[lHeader] = true;
      }
    }

    utils.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

    return this;
  }
}

AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

utils.freezeMethods(AxiosHeaders.prototype);
utils.freezeMethods(AxiosHeaders);

export default AxiosHeaders;
