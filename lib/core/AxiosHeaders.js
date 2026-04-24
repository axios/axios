'use strict';

import utils from '../utils.js';
import parseHeaders from '../helpers/parseHeaders.js';

const $internals = Symbol('internals');

/**
 * Normalize a header name by trimming and converting to lowercase
 * @param {string} header - The header name
 * @returns {string} Normalized header name
 */
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}


/**
 * Normalize a header value. Converts arrays recursively, leaves false/null/undefined as is.
 * @param {*} value - The header value
 * @returns {*} Normalized value
 */
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }

  return utils.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}


/**
 * Parse a header value into key-value tokens
 * @param {string} str - The header value string
 * @returns {Object} Parsed tokens as key-value pairs
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


/**
 * Validate if a string is a valid HTTP header name
 * @param {string} str - The header name
 * @returns {boolean} True if valid, false otherwise
 */
const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());


/**
 * Match a header value or name against a filter
 * @param {Object} context - The context object (usually AxiosHeaders instance)
 * @param {*} value - The header value
 * @param {string} header - The header name
 * @param {Function|string|RegExp} filter - The filter to match
 * @param {boolean} [isHeaderNameFilter] - Whether to match header name instead of value
 * @returns {boolean|undefined} True if matched, false otherwise
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


/**
 * Format a header name to Title-Case
 * @param {string} header - The header name
 * @returns {string} Formatted header name
 */
function formatHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
}


/**
 * Build accessor methods (get/set/has) for a header on an object
 * @param {Object} obj - The target object
 * @param {string} header - The header name
 */
function buildAccessors(obj, header) {
  const accessorName = utils.toCamelCase(' ' + header);

  ['get', 'set', 'has'].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function (arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true,
    });
  });
}

class AxiosHeaders {
  /**
   * Create a new AxiosHeaders instance
   * @param {Object|AxiosHeaders} [headers] - Initial headers to set
   */
  constructor(headers) {
    headers && this.set(headers);
  }

  /**
   * Set a header or multiple headers
   * @param {string|Object|Iterable} header - Header name, object, or iterable
   * @param {*} [valueOrRewrite] - Value for the header or rewrite flag
   * @param {boolean} [rewrite] - Whether to overwrite existing value
   * @returns {AxiosHeaders} This instance for chaining
   */
  set(header, valueOrRewrite, rewrite) {
    const self = this;

    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      const key = utils.findKey(self, lHeader);

      if (
        !key ||
        self[key] === undefined ||
        _rewrite === true ||
        (_rewrite === undefined && self[key] !== false)
      ) {
        self[key || _header] = normalizeValue(_value);
      }
    }

    const setHeaders = (headers, _rewrite) =>
      utils.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

    if (utils.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils.isObject(header) && utils.isIterable(header)) {
      let obj = {},
        dest,
        key;
      for (const entry of header) {
        if (!utils.isArray(entry)) {
          throw TypeError('Object iterator must return a key-value pair');
        }

        obj[(key = entry[0])] = (dest = obj[key])
          ? utils.isArray(dest)
            ? [...dest, entry[1]]
            : [dest, entry[1]]
          : entry[1];
      }

      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }

    return this;
  }

  /**
   * Get a header value, optionally parsing it
   * @param {string} header - Header name
   * @param {boolean|RegExp|Function} [parser] - Optional parser (true for tokens, RegExp, or function)
   * @returns {*} Header value or parsed result
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
   * Check if a header exists and optionally matches a value or pattern
   *
   * @param {string} header - The header name to check
   * @param {string|RegExp|Function} [matcher] - Optional matcher for the header value (string, RegExp, or function)
   * @returns {boolean} True if the header exists and matches the matcher (if provided), otherwise false
   */
  has(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils.findKey(this, header);

      return !!(
        key &&
        this[key] !== undefined &&
        (!matcher || matchHeaderValue(this, this[key], key, matcher))
      );
    }

    return false;
  }

  /**
   * Delete a header or headers
   * @param {string|string[]} header - Header name or array of names
   * @param {string|RegExp|Function} [matcher] - Optional matcher for value
   * @returns {boolean} True if any header was deleted
   */
  delete(header, matcher) {
    const self = this;
    let deleted = false;

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
   * Clear all headers, optionally filtered by matcher
   * @param {string|RegExp|Function} [matcher] - Optional matcher for header names
   * @returns {boolean} True if any headers were deleted
   */
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;

    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }

    return deleted;
  }

  /**
   * Normalize header names and values
   * @param {boolean} [format] - Whether to format header names to Title-Case
   * @returns {AxiosHeaders} This instance for chaining
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

  /**
   * Concatenate this headers instance with others
   * @param {...Object} targets - Other headers to merge
   * @returns {AxiosHeaders} New AxiosHeaders instance
   */
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }

  /**
   * Convert headers to a plain object
   * @param {boolean} [asStrings] - Join array values as comma-separated strings
   * @returns {Object} Plain object of headers
   */
  toJSON(asStrings) {
    const obj = Object.create(null);

    utils.forEach(this, (value, header) => {
      value != null &&
        value !== false &&
        (obj[header] = asStrings && utils.isArray(value) ? value.join(', ') : value);
    });

    return obj;
  }

  /**
   * Iterator for headers as [key, value] pairs
   * @returns {Iterator} Iterator over [header, value] pairs
   */
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }

  /**
   * Convert headers to string representation
   * @returns {string} Headers as string
   */
  toString() {
    return Object.entries(this.toJSON())
      .map(([header, value]) => header + ': ' + value)
      .join('\n');
  }

  /**
   * Get the value of the 'set-cookie' header as an array
   * @returns {Array} Array of set-cookie values
   */
  getSetCookie() {
    return this.get('set-cookie') || [];
  }

  /**
   * String tag for Object.prototype.toString
   * @returns {string}
   */
  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }

  /**
   * Create an AxiosHeaders instance from an object or another AxiosHeaders
   * @param {Object|AxiosHeaders} thing - Source object or AxiosHeaders
   * @returns {AxiosHeaders} New AxiosHeaders instance
   */
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }

  /**
   * Concatenate multiple headers into a new AxiosHeaders instance
   * @param {Object} first - First headers object
   * @param {...Object} targets - Other headers to merge
   * @returns {AxiosHeaders} New AxiosHeaders instance
   */
  static concat(first, ...targets) {
    const computed = new this(first);

    targets.forEach((target) => computed.set(target));

    return computed;
  }

  /**
   * Define accessor methods for specific headers
   * @param {string|string[]} header - Header name or array of names
   * @returns {typeof AxiosHeaders} The AxiosHeaders class
   */
  static accessor(header) {
    const internals =
      (this[$internals] =
      this[$internals] =
        {
          accessors: {},
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

AxiosHeaders.accessor([
  'Content-Type',
  'Content-Length',
  'Accept',
  'Accept-Encoding',
  'User-Agent',
  'Authorization',
]);

// reserved names hotfix
utils.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    },
  };
});

utils.freezeMethods(AxiosHeaders);

export default AxiosHeaders;
