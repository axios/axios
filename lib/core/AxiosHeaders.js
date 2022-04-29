'use strict';

var utils = require('../utils');

var $internals = Symbol('internals');

var hasOwnProperty = utils.hasOwnProperty;

function tokensParser(str) {
  var tokens = Object.create(null);
  var tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  var match;

  while ((match = tokensRE.exec(str))) {
    tokens[match[1]] = match[2];
  }

  return tokens;
}

function normalizeHeaderCase(header) {
  return header && String(header).trim().toLowerCase();
}

function filterHeaderValue(value, filter, header, headers) {
  if (utils.isFunction(filter)) {
    return filter.call(this, value, header, headers);
  }

  if (value === false) return;

  if (utils.isString(filter)) {
    return value.indexOf(filter) !== -1;
  }

  if (utils.isRegExp(filter)) {
    return filter.test(value);
  }
}

function normalizeName(header) {
  return header
    .toLowerCase().replace(/([a-z\d])(\w*)/g, function(w, char, str) {
      return char.toUpperCase() + str;
    });
}

function AxiosHeaders(headers) {
  this[$internals] = {
    headers: {},
    names: {},
    accessors: {}
  };

  headers && this.set(headers);
}

Object.assign(AxiosHeaders.prototype, {
  set: function(header, valueOrRewrite, rewrite) {
    var internals = this[$internals];
    var headers = internals.headers;
    var names = internals.names;

    function setHeader(value, header, _rewrite) {
      var lHeader = normalizeHeaderCase(header);

      if (!lHeader) {
        throw new Error('header name can not be an empty string');
      }

      var has;

      if (
        hasOwnProperty(headers, lHeader) &&
        (_rewrite === false || (_rewrite === undefined && headers[lHeader] === false))
      ) {
        return;
      }

      if (value === null) {
        has && this.delete(lHeader);
        return;
      }

      if (value !== false && !utils.isArray(value)) {
        value = String(value).trim();
      }

      headers[lHeader] = value;

      if (!hasOwnProperty(names, lHeader)) {
        names[lHeader] = header;
      }
    }

    if (utils.isString(header)) {
      setHeader(valueOrRewrite, header, rewrite);
    } else if (utils.isPlainObject(header)) {
      utils.forEach(header, function(value, header) {
        setHeader(value, header, valueOrRewrite);
      });
    } else {
      throw new TypeError('Header must be a string or an plain object');
    }

    return this;
  },

  get: function(header, parser) {
    var internals = this[$internals];
    var headers = internals.headers;
    header = normalizeHeaderCase(header);

    if (!hasOwnProperty(headers, header)) {
      return undefined;
    }

    var value = headers[header];

    if (!parser || value === false) {
      return value;
    }

    if (parser === true) {
      return tokensParser(value);
    }

    if (utils.isFunction(parser)) {
      return parser.call(this, value, header, headers) ? value : null;
    }

    if (utils.isRegExp(parser)) {
      return parser.exec(value);
    }

    throw TypeError('parser must be boolean|regexp|function');
  },

  has: function(header, filter) {
    var headers = this[$internals].headers;
    header = normalizeHeaderCase(header);

    return !!(header && hasOwnProperty(headers, header) &&
      (!filter || filterHeaderValue.call(this, headers[header], filter, header, headers)));
  },

  delete: function(header, filter) {
    var self = this;
    var internals = self[$internals];
    var headers = internals.headers;
    var deleted = false;

    function deleteHeader(header) {
      header = normalizeHeaderCase(header);

      if (header && hasOwnProperty(headers, header) &&
        (!filter || filterHeaderValue.call(self, headers[header], filter, header, headers))) {
        delete headers[header];
        delete internals.names[header];
        deleted = true;
        return true;
      }

      return false;
    }

    if (utils.isArray(header)) {
      header.forEach(deleteHeader);
      return deleted;
    }

    return deleteHeader(header);
  },

  accessor: function(header) {
    var self = this;
    var internals = self[$internals];
    var accessors = internals.accessors;

    function defineAccessor(_header) {
      var lHeader = normalizeHeaderCase(_header);

      if (!accessors[lHeader]) {
        var names = internals.names;
        var accessorName = utils.toCamelCase(' ' + _header);

        Object.defineProperty(self, 'get' + accessorName, {
          value: function(parser) {
            return this.get(lHeader, parser);
          },
          configurable: true
        });

        Object.defineProperty(self, 'set' + accessorName, {
          value: function(value, rewrite) {
            return this.set(lHeader, value, rewrite);
          },
          configurable: true
        });

        accessors[lHeader] = true;

        if (!hasOwnProperty(names, lHeader)) {
          names[lHeader] = _header;
        }
      }
    }

    if (header == null) {
      header = internals.names;
    }

    if (utils.isPlainObject(header)) {
      utils.forEach(header, defineAccessor);
    } else {
      defineAccessor(header);
    }

    return this;
  },

  normalize: function(formatter) {
    var internals = this[$internals];

    if (formatter == null) {
      formatter = normalizeName;
    }

    utils.forEach(internals.headers, function(value, header) {
      internals.names[header] = formatter.call(this, header, value);
    });

    return this;
  },

  toJSON: function(asStringValues) {
    var internals = this[$internals];
    var names = internals.names;
    var obj = Object.create(null);

    utils.forEach(internals.headers, function(value, header) {
      value !== false && (obj[names[header] || header] = asStringValues !== false &&
      utils.isArray(value) ? value.join(', ') : value);
    });

    return obj;
  }
});

// AxiosHeaders whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = utils.toObjectSet([
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
]);

Object.assign(AxiosHeaders, {
  /**
   * Parse rawHeaders into an object
   *
   * ```
   * Date: Wed, 27 Aug 2014 08:58:49 GMT
   * Content-Type: application/json
   * Connection: keep-alive
   * Transfer-Encoding: chunked
   * ```
   *
   * @param {String} rawHeaders AxiosHeaders needing to be parsed
   * @param {Boolean} asPlainObject return a plain object instead of AxiosHeader instance
   * @returns {Object} AxiosHeaders parsed into an object
   */
  parse: function(rawHeaders, asPlainObject) {
    var parsed = {};
    var key;
    var val;
    var i;

    if (!rawHeaders) { return asPlainObject ? parsed : new this(); }

    rawHeaders.split('\n').forEach(function parser(line) {
      i = line.indexOf(':');
      key = line.substring(0, i).trim().toLowerCase();
      val = line.substring(i + 1).trim();

      if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
        return;
      }

      if (key === 'set-cookie') {
        if (parsed[key]) {
          parsed[key].push(val);
        } else {
          parsed[key] = [val];
        }
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    });

    return asPlainObject ? parsed : new this(parsed);
  }
});

utils.freezeMethods(AxiosHeaders.prototype);
utils.freezeMethods(AxiosHeaders);

module.exports = AxiosHeaders;
