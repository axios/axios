'use strict';

var utils = require('../utils.js');
var parseHeaders = require('../helpers/parseHeaders');

var $internals = Symbol('internals');
var $defaults = Symbol('defaults');

function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }

  return String(value);
}

function parseTokens(str) {
  var tokens = Object.create(null);
  var tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  var match;

  while ((match = tokensRE.exec(str))) {
    tokens[match[1]] = match[2];
  }

  return tokens;
}

function matchHeaderValue(context, value, header, filter) {
  if (utils.isFunction(filter)) {
    return filter.call(this, value, header);
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
    .toLowerCase().replace(/([a-z\d])(\w*)/g, function(w, char, str) {
      return char.toUpperCase() + str;
    });
}

function findKey(obj, key) {
  key = key.toLowerCase();
  var keys = Object.keys(obj);
  var i = keys.length;
  var _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}

function AxiosHeaders(headers, defaults) {
  headers && this.set(headers);
  this[$defaults] = defaults || null;
}

Object.assign(AxiosHeaders.prototype, {
  set: function(header, valueOrRewrite, rewrite) {
    var self = this;

    function setHeader(_value, _header, _rewrite) {
      var lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      var key = findKey(self, lHeader);

      if (key && _rewrite !== true && (self[key] === false || _rewrite === false)) {
        return;
      }

      if (utils.isArray(_value)) {
        _value = _value.map(normalizeValue);
      } else {
        _value = normalizeValue(_value);
      }

      self[key || _header] = _value;
    }

    if (utils.isPlainObject(header)) {
      utils.forEach(header, function(_value, _header) {
        setHeader(_value, _header, valueOrRewrite);
      });
    } else {
      setHeader(valueOrRewrite, header, rewrite);
    }

    return this;
  },

  get: function(header, parser) {
    header = normalizeHeader(header);

    if (!header) return undefined;

    var key = findKey(this, header);

    if (key) {
      var value = this[key];

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
  },

  has: function(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      var key = findKey(this, header);

      return !!(key && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }

    return false;
  },

  delete: function(header, matcher) {
    var self = this;
    var deleted = false;

    function deleteHeader(_header) {
      _header = normalizeHeader(_header);

      if (_header) {
        var key = findKey(self, _header);

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
  },

  clear: function() {
    return Object.keys(this).forEach(this.delete.bind(this));
  },

  normalize: function(format) {
    var self = this;
    var headers = {};

    utils.forEach(this, function(value, header) {
      var key = findKey(headers, header);

      if (key) {
        self[key] = normalizeValue(value);
        delete self[header];
        return;
      }

      var normalized = format ? formatHeader(header) : String(header).trim();

      if (normalized !== header) {
        delete self[header];
      }

      self[normalized] = normalizeValue(value);

      headers[normalized] = true;
    });

    return this;
  },

  toJSON: function() {
    var obj = Object.create(null);

    utils.forEach(Object.assign({}, this[$defaults] || null, this),
      function(value, header) {
        if (value == null || value === false) return;
        obj[header] = utils.isArray(value) ? value.join(', ') : value;
      });

    return obj;
  }
});

Object.assign(AxiosHeaders, {
  from: function(thing) {
    if (utils.isString(thing)) {
      return new this(parseHeaders(thing));
    }
    return thing instanceof this ? thing : new this(thing);
  },

  accessor: function(header) {
    var internals = this[$internals] = (this[$internals] = {
      accessors: {}
    });

    var accessors = internals.accessors;
    var prototype = this.prototype;

    function defineAccessor(_header) {
      var lHeader = normalizeHeader(_header);

      if (!accessors[lHeader]) {
        var accessorName = utils.toCamelCase(' ' + _header);

        Object.defineProperty(prototype, 'get' + accessorName, {
          value: function(parser) {
            return this.get(lHeader, parser);
          },
          configurable: true
        });

        Object.defineProperty(prototype, 'set' + accessorName, {
          value: function(value, rewrite) {
            return this.set(formatHeader(lHeader), value, rewrite);
          },
          configurable: true
        });

        accessors[lHeader] = true;
      }
    }

    utils.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

    return this;
  }
});

AxiosHeaders.accessor(['Content-Type', 'Accept', 'Accept-Encoding', 'User-Agent']);

utils.freezeMethods(AxiosHeaders.prototype);
utils.freezeMethods(AxiosHeaders);

module.exports = AxiosHeaders;
