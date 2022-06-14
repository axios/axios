'use strict';

import utils from '../utils.js';
import parseHeaders from '../helpers/parseHeaders.js';

const $internals = Symbol('internals');
const $defaults = Symbol('defaults');

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
  const tokens = Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;

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
    .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
}

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

function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
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
    const self = this;

    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      const key = findKey(self, lHeader);

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
      utils.forEach(header, (_value, _header) => {
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

    const key = findKey(this, header);

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
  },

  has: function(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      const key = findKey(this, header);

      return !!(key && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }

    return false;
  },

  delete: function(header, matcher) {
    const self = this;
    let deleted = false;

    function deleteHeader(_header) {
      _header = normalizeHeader(_header);

      if (_header) {
        const key = findKey(self, _header);

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
    const self = this;
    const headers = {};

    utils.forEach(this, (value, header) => {
      const key = findKey(headers, header);

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
  },

  toJSON: function() {
    const obj = Object.create(null);

    utils.forEach(Object.assign({}, this[$defaults] || null, this),
      (value, header) => {
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
});

AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent']);

utils.freezeMethods(AxiosHeaders.prototype);
utils.freezeMethods(AxiosHeaders);

export default AxiosHeaders;
