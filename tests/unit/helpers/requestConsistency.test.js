import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import utils from '../../../lib/utils.js';
import formDataToJSON from '../../../lib/helpers/formDataToJSON.js';
import toFormData from '../../../lib/helpers/toFormData.js';

function FormDataMock(entries) {
  this._entries = entries;
}
FormDataMock.prototype.append = function () {};
FormDataMock.prototype.toString = function () {
  return '[object FormData]';
};
FormDataMock.prototype[Symbol.iterator] = function () {
  var entries = this._entries;
  var index = 0;
  return {
    next: function () {
      return index < entries.length ? { value: entries[index++], done: false } : { done: true };
    },
  };
};
FormDataMock.prototype.entries = FormDataMock.prototype[Symbol.iterator];

function nestedParams(depth) {
  var params = {};
  var value = params;
  for (var i = 0; i < depth; i++) {
    value.next = {};
    value = value.next;
  }
  value.leaf = 'value';
  return params;
}

describe('request input consistency', function () {
  it('keeps sparse field indexes as object keys', function () {
    [100000, 4294967294].forEach(function (index) {
      var result = formDataToJSON(new FormDataMock([['items[' + index + '][name]', 'value']]));
      assert.strictEqual(Array.isArray(result.items), false);
      assert.strictEqual(result.items[index].name, 'value');
      assert.ok(JSON.stringify(result).length < 100);
    });
  });

  it('keeps dense indexes as arrays regardless of insertion order', function () {
    var result = formDataToJSON(
      new FormDataMock([
        ['items[1]', 'second'],
        ['items[0]', 'first'],
      ])
    );
    assert.deepStrictEqual(result.items, ['first', 'second']);
  });

  it('handles repeated names after indexed fields without filling missing indexes', function () {
    var result = formDataToJSON(
      new FormDataMock([
        ['items[100000]', 'first'],
        ['items', 'second'],
      ])
    );
    assert.strictEqual(Array.isArray(result.items[0]), false);
    assert.strictEqual(result.items[0][100000], 'first');
    assert.ok(JSON.stringify(result).length < 100);
  });

  it('does not expand array-like objects from their length alone', function () {
    assert.strictEqual(utils.toArray({ length: 100000 }), null);
    [NaN, Infinity, -1, 1.5].forEach(function (length) {
      assert.strictEqual(utils.toArray({ length: length }), null);
    });
    assert.deepStrictEqual(utils.toArray({ 0: 'first', 1: 'second', length: 2 }), [
      'first',
      'second',
    ]);
    assert.deepStrictEqual(utils.toArray('abc'), ['a', 'b', 'c']);
  });

  it('serializes an ordinary length property as a bounded multipart field', function () {
    var entries = [];
    toFormData(
      { 'items[]': { length: 100000 } },
      {
        append: function (name, value) {
          entries.push([name, String(value)]);
        },
      }
    );
    assert.deepStrictEqual(entries, [['items[length]', '100000']]);
  });

  ['request', 'get', 'post', 'postForm'].forEach(function (method) {
    it('rejects deep params through the ' + method + ' promise', function () {
      var request;
      var config = {
        params: nestedParams(3000),
        adapter: function () {
          throw new Error('adapter should not run');
        },
      };
      assert.doesNotThrow(function () {
        request =
          method === 'request'
            ? axios.request(config)
            : method === 'get'
              ? axios.get('/resource', config)
              : axios[method]('/resource', {}, config);
      });
      assert.strictEqual(typeof request.then, 'function');
      return assert.rejects(request, function (error) {
        return error.code === 'ERR_BAD_OPTION_VALUE' && !(error instanceof RangeError);
      });
    });
  });

  it('retains supported nested params without mutating the caller', function () {
    var params = nestedParams(25);
    return axios.get('/resource', {
      params: params,
      adapter: function (config) {
        assert.notStrictEqual(config.params, params);
        assert.deepStrictEqual(config.params, params);
        return Promise.resolve({ data: 'ok', status: 200, headers: {}, config: config });
      },
    });
  });

  it('rejects circular params with a bounded error', function () {
    var params = {};
    params.next = params;
    return assert.rejects(axios.get('/resource', { params: params }), function (error) {
      return error.code === 'ERR_BAD_OPTION_VALUE';
    });
  });
});
