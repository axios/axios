'use strict';

var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var axios = require('../../../index');
var utils = require('../../../lib/utils');
var AxiosError = require('../../../lib/core/AxiosError');

function Params(value) {
  this.filter = value;
}

function nested(depth) {
  var value = {leaf: 'value'};
  while (depth--) value = {next: value};
  return value;
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

  it('validates parameter roots without a WeakMap implementation', function() {
    var sandbox = {
      module: {exports: {}},
      WeakMap: undefined,
      require: function(name) {
        if (name === '../utils') return utils;
        if (name === '../core/AxiosError') return AxiosError;
        throw new Error('Unexpected module ' + name);
      }
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../../../lib/helpers/assertParamsDepth'), 'utf8'), sandbox);
    var validate = sandbox.module.exports;
    assert.doesNotThrow(function() { validate(undefined); });
    assert.doesNotThrow(function() { validate(new Params({name: 'value'})); });
    assert.throws(function() { validate(new Params(nested(150))); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
    var circular = {};
    circular.next = circular;
    assert.throws(function() { validate(new Params(circular)); }, function(error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
  });
});
