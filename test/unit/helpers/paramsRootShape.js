'use strict';

var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var axios = require('../../../index');
var utils = require('../../../lib/utils');
var AxiosError = require('../../../lib/core/AxiosError');
var assertParamsDepth = require('../../../lib/helpers/assertParamsDepth');

function Params(value) {
  this.filter = value;
}

function nested(depth) {
  var value = {leaf: 'value'};
  while (depth--) value = {next: value};
  return value;
}

function legacyValidator(mapImplementation, metrics) {
  var sandbox = {
    module: {exports: {}},
    WeakMap: undefined,
    Map: mapImplementation,
    metrics: metrics || {scanned: 0, maxScan: 0},
    require: function(name) {
      if (name === '../utils') return utils;
      if (name === '../core/AxiosError') return AxiosError;
      throw new Error('Unexpected module ' + name);
    }
  };
  var instrument = [
    'var originalIndexOf = Array.prototype.indexOf;',
    'Array.prototype.indexOf = function() {',
    '  metrics.scanned += this.length;',
    '  metrics.maxScan = Math.max(metrics.maxScan, this.length);',
    '  return originalIndexOf.apply(this, arguments);',
    '};'
  ].join('\n');
  vm.runInNewContext(instrument + '\n' +
    fs.readFileSync(require.resolve('../../../lib/helpers/assertParamsDepth'), 'utf8'), sandbox);
  return sandbox.module.exports;
}

describe('parameter root shapes', function() {
  ['request', 'get', 'post', 'postForm'].forEach(function(method) {
    it('checks custom object roots through ' + method, function() {
      var params = new Params(nested(150));
      var config = {
        params: params,
        adapter: function() { throw new Error('adapter should not run'); }
      };
      var request;
      assert.doesNotThrow(function() {
        request = method === 'request' ? axios.request(config) :
          method === 'get' ? axios.get('/resource', config) :
            axios[method]('/resource', {}, config);
      });
      return assert.rejects(request, function(error) {
        return error.code === 'ERR_BAD_OPTION_VALUE' && !(error instanceof RangeError);
      });
    });
  });

  it('serializes supported custom object roots', function() {
    var params = new Params({name: 'value'});
    assert.strictEqual(axios.getUri({url: '/resource', params: params}),
      '/resource?filter[name]=value');
    assert.deepStrictEqual(params.filter, {name: 'value'});
  });

  it('leaves nested custom values opaque to the default serializer', function() {
    var opaque = new Params(nested(150));
    opaque.toString = function() { return 'opaque'; };
    assert.strictEqual(axios.getUri({url: '/resource', params: new Params(opaque)}),
      '/resource?filter=opaque');
  });

  it('validates parameter roots without identity maps', function() {
    var validate = legacyValidator();
    assert.doesNotThrow(function() { validate(undefined); });
    assert.doesNotThrow(function() { validate(new Params({name: 'value'})); });
    assert.doesNotThrow(function() { validate(new Params(nested(99))); });
    assert.throws(function() { validate(new Params(nested(150))); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
    var circular = {};
    circular.next = circular;
    assert.throws(function() { validate(new Params(circular)); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
    var array = [];
    array.push({back: array});
    assert.throws(function() { validate(new Params(array)); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
  });

  it('uses an available Map when WeakMap is absent', function() {
    var stored = 0;
    function TrackingMap() {
      this.entries = new Map();
    }
    TrackingMap.prototype.has = function(value) { return this.entries.has(value); };
    TrackingMap.prototype.get = function(value) { return this.entries.get(value); };
    TrackingMap.prototype.set = function(value, depth) {
      stored++;
      this.entries.set(value, depth);
    };
    var shared = Object.freeze({name: 'value'});
    var validate = legacyValidator(TrackingMap);
    assert.doesNotThrow(function() {
      validate(new Params(Object.freeze({first: shared, second: shared})));
    });
    assert.strictEqual(stored, 3);
  });

  it('keeps fallback identity scans bounded as frozen params grow wider', function() {
    function measure(width) {
      var metrics = {scanned: 0, maxScan: 0};
      var fields = {};
      for (var i = 0; i < width; i++) {
        fields['field' + i] = Object.freeze({name: 'value'});
      }
      Object.freeze(fields);
      var params = Object.freeze(new Params(fields));
      assert.doesNotThrow(function() { legacyValidator(undefined, metrics)(params); });
      assert.strictEqual(Object.keys(fields).length, width);
      assert.strictEqual(Object.getOwnPropertyNames(params).join(','), 'filter');
      assert.strictEqual(Object.isFrozen(fields.field0), true);
      return metrics;
    }
    var smaller = measure(256);
    var larger = measure(512);
    assert.ok(smaller.maxScan < 256);
    assert.strictEqual(larger.maxScan, smaller.maxScan);
    assert.ok(larger.scanned < smaller.scanned * 2.6);
  });

  it('reuses recently completed shared subgraphs without identity maps', function() {
    var reads = 0;
    var value = Object.freeze({leaf: 'value'});
    for (var i = 0; i < 8; i++) {
      value = (function(child) {
        var parent = {right: child};
        Object.defineProperty(parent, 'left', {
          enumerable: true,
          get: function() {
            reads++;
            return child;
          }
        });
        return Object.freeze(parent);
      })(value);
    }
    assert.doesNotThrow(function() { legacyValidator()(Object.freeze(new Params(value))); });
    assert.strictEqual(reads, 8);
  });

  it('rechecks a shared object when reached at a greater depth', function() {
    var shared = Object.freeze(nested(99));
    var root = {deeper: {value: shared}, shallow: shared};
    assert.throws(function() { legacyValidator()(root); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
  });

  it('keeps nested custom values opaque without identity maps', function() {
    var opaque = new Params(nested(150));
    opaque.toString = function() { return 'opaque'; };
    assert.doesNotThrow(function() { legacyValidator()(new Params(opaque)); });
  });
});

describe('parameter array fields', function() {
  function validate(params) {
    assertParamsDepth(params);
    legacyValidator()(params);
  }

  it('ignores named and noncanonical metadata on root and nested arrays', function() {
    var array = ['value'];
    ['metadata', '01', '1.0', '1e0', '-1', '4294967295'].forEach(function(key) {
      Object.defineProperty(array, key, {
        enumerable: true,
        get: function() { throw new Error('Array metadata should not be read'); }
      });
    });
    array.deep = nested(150);
    array.circular = array;
    assert.doesNotThrow(function() { validate(array); validate(new Params(array)); });
    assert.strictEqual(axios.getUri({url: '/resource', params: array}), '/resource?0=value');
    assert.strictEqual(axios.getUri({url: '/resource', params: new Params(array)}),
      '/resource?filter[]=value');
  });

  it('includes hidden numeric slots while preserving holes', function() {
    var array = new Array(4);
    Object.defineProperty(array, '2', {value: {name: 'value'}, enumerable: false});
    assert.doesNotThrow(function() { validate(array); validate(new Params(array)); });
    assert.strictEqual(axios.getUri({url: '/resource', params: array}), '/resource?2[name]=value');
    assert.strictEqual(axios.getUri({url: '/resource', params: new Params(array)}),
      '/resource?filter[2][name]=value');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(array, '0'), false);
    assert.strictEqual(Object.getOwnPropertyDescriptor(array, '2').enumerable, false);
  });

  it('reads inherited numeric slots through the original array', function() {
    var parent = Object.create(Array.prototype);
    var array = new Array(3);
    Object.defineProperty(parent, '1', {
      get: function() {
        assert.strictEqual(this, array);
        return {name: 'value'};
      }
    });
    Object.setPrototypeOf(array, parent);
    assert.doesNotThrow(function() { validate(array); validate(new Params(array)); });
    assert.strictEqual(axios.getUri({url: '/resource', params: array}), '/resource?1[name]=value');
    assert.strictEqual(axios.getUri({url: '/resource', params: new Params(array)}),
      '/resource?filter[1][name]=value');
  });

  it('honors own slots that shadow inherited values', function() {
    var parent = Object.create(Array.prototype);
    Object.defineProperty(parent, '0', {
      get: function() { throw new Error('Shadowed array slot should not be read'); }
    });
    var array = new Array(2);
    Object.setPrototypeOf(array, parent);
    Object.defineProperty(array, '0', {value: undefined});
    assert.doesNotThrow(function() { validate(array); validate(new Params(array)); });
    assert.strictEqual(axios.getUri({url: '/resource', params: array}), '/resource');
  });

  ['hidden', 'inherited'].forEach(function(kind) {
    it('checks depth and cycles in ' + kind + ' numeric slots', function() {
      [assertParamsDepth, legacyValidator()].forEach(function(check) {
        var array = new Array(2);
        var owner = kind === 'hidden' ? array : Object.create(Array.prototype);
        if (kind === 'inherited') Object.setPrototypeOf(array, owner);
        Object.defineProperty(owner, '1', {value: nested(150), configurable: true});
        [array, new Params(array)].forEach(function(params) {
          assert.throws(function() { check(params); }, function(error) {
            return error.code === 'ERR_BAD_OPTION_VALUE';
          });
        });
        Object.defineProperty(owner, '1', {value: array, configurable: true});
        assert.throws(function() { check(array); }, function(error) {
          return error.code === 'ERR_BAD_OPTION_VALUE';
        });
      });
    });
  });

  it('supports sparse arrays with a longer local prototype chain', function() {
    var parent = Array.prototype;
    for (var i = 0; i < 32; i++) parent = Object.create(parent);
    Object.defineProperty(parent, '15', {value: {name: 'value'}});
    var array = new Array(64);
    Object.setPrototypeOf(array, parent);
    Object.freeze(array);
    assert.doesNotThrow(function() { validate(array); });
    assert.strictEqual(Object.getPrototypeOf(array), parent);
    assert.strictEqual(Object.getOwnPropertyNames(array).join(','), 'length');
  });

  it('stops a repeated virtual prototype without walking indefinitely', function() {
    var calls = 0;
    var array;
    array = new Proxy([], {
      getPrototypeOf: function() {
        calls++;
        return array;
      }
    });
    assert.throws(function() { assertParamsDepth(array); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
    assert.ok(calls < 10);
  });
});
