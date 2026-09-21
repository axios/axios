'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var createRequire = require('module').createRequire;
var utils = require('../../../lib/utils');
var toFormData = require('../../../lib/helpers/toFormData');
var formDataToJSON = require('../../../lib/helpers/formDataToJSON');

function multipartEntries(value) {
  var entries = [];
  toFormData(
    { 'items[]': value },
    {
      append: function (name, part) {
        entries.push([name, String(part)]);
      }
    }
  );
  return entries;
}

function convertFields(entries) {
  var fields = Object.create({
    append: function () {},
    toString: function () {
      return '[object FormData]';
    },
    entries: function () {
      return entries[Symbol.iterator]();
    }
  });
  fields[Symbol.iterator] = fields.entries;
  return formDataToJSON(fields);
}

function loadLegacyModule(filename, overrides) {
  var localRequire = createRequire(filename);
  var context = vm.createContext({
    module: {exports: {}},
    require: function(name) {
      return overrides && Object.prototype.hasOwnProperty.call(overrides, name) ?
        overrides[name] : localRequire(name);
    }
  });
  vm.runInContext([
    'Number.isSafeInteger = Number.isInteger = Number.isFinite = undefined;',
    'Set = WeakMap = undefined;',
    'var getNames = Object.getOwnPropertyNames;',
    'var getPrototype = Object.getPrototypeOf;',
    'function assertObject(value) {',
    '  if (value === null || (typeof value !== "object" && typeof value !== "function")) {',
    '    throw new TypeError("Expected an object");',
    '  }',
    '}',
    'Object.getOwnPropertyNames = function(value) { assertObject(value); return getNames(value); };',
    'Object.getPrototypeOf = function(value) { assertObject(value); return getPrototype(value); };',
    '(function(module, require) {',
    fs.readFileSync(filename, 'utf8'),
    '})(module, require);'
  ].join('\n'), context, {filename: filename});
  return {exports: context.module.exports, context: context};
}

describe('indexed multipart fields', function () {
  it('unwraps non-enumerable indexes', function () {
    var values = { length: 2 };
    Object.defineProperties(values, {
      0: { value: 'first' },
      1: { value: 'second' }
    });

    assert.deepStrictEqual(utils.toArray(values), ['first', 'second']);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'],
      ['items[]', 'second']
    ]);
  });

  it('unwraps present sparse array values under an array key', function () {
    var values = new Array(4);
    values[1] = 'first';
    values[3] = 'second';

    assert.strictEqual(utils.toArray(values), values);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'],
      ['items[]', 'second']
    ]);
  });

  it('unwraps prototype-backed indexes without counting duplicates twice', function () {
    var prototype = {};
    Object.defineProperties(prototype, {
      0: { value: 'inherited', configurable: true },
      1: { value: 'second' }
    });
    var values = Object.create(prototype, {
      0: { value: 'first' },
      length: { value: 2, writable: true }
    });

    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'],
      ['items[]', 'second']
    ]);

    Object.defineProperty(values, 'length', { value: 3 });
    assert.strictEqual(utils.toArray(values), null);
  });

  it('unwraps native array-like values and inherited length accessors', function () {
    assert.deepStrictEqual(utils.toArray(new Uint8Array([1, 2])), [1, 2]);
    assert.deepStrictEqual(
      (function () {
        return utils.toArray(arguments);
      })('first', 'second'),
      ['first', 'second']
    );

    var prototype = {};
    Object.defineProperty(prototype, 'length', {
      get: function () {
        return 2;
      }
    });
    var values = Object.create(prototype, {
      0: { value: 'first' },
      1: { value: 'second' }
    });
    assert.deepStrictEqual(utils.toArray(values), ['first', 'second']);
  });

  it('does not fill an index gap from unrelated fields', function () {
    var values = { 0: 'first', length: 2, label: 'x' };

    assert.strictEqual(utils.toArray(values), null);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[0]', 'first'],
      ['items[length]', '2'],
      ['items[label]', 'x']
    ]);
  });

  it('keeps unrelated fields when indexed values are absent', function () {
    var values = { length: 1, label: 'x' };

    assert.strictEqual(utils.toArray(values), null);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[length]', '1'],
      ['items[label]', 'x']
    ]);
  });

  it('does not count non-canonical numeric properties or indexes beyond length', function () {
    ['00', '-0', '+0', '1e0', '1', '4294967295'].forEach(function (key) {
      var values = { length: 1 };
      values[key] = 'value';
      assert.strictEqual(utils.toArray(values), null, key);
    });
  });

  it('rejects unsupported array lengths without reading indexed values', function () {
    [100000, 4294967296, 9007199254740991].forEach(function (length) {
      var reads = 0;
      var values = { length: length, label: 'x' };
      Object.defineProperty(values, '0', {
        get: function () {
          reads++;
          return 'first';
        }
      });

      assert.strictEqual(utils.toArray(values), null);
      assert.strictEqual(reads, 0);
    });
  });

  ['00', '01', '1e0', '4294967295', '9007199254740992'].forEach(function (key) {
    it('retains the numeric-looking JSON key ' + key, function () {
      var result = convertFields([['items[' + key + '][name]', 'value']]);
      var expected = { items: {} };
      expected.items[key] = { name: 'value' };

      assert.deepStrictEqual(result, expected);
      assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), expected);
    });
  });

  it('retains mixed indexes even when key count equals array length', function () {
    var result = convertFields([
      ['items[1]', 'second'],
      ['items[01]', 'named']
    ]);
    var expected = { items: { 1: 'second', '01': 'named' } };

    assert.deepStrictEqual(result, expected);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), expected);
  });

  it('retains dense indexes together with non-index properties', function () {
    var result = convertFields([
      ['items[0]', 'first'],
      ['items[01]', 'named']
    ]);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
      items: { 0: 'first', '01': 'named' }
    });
  });

  it('normalizes non-index properties before appending a repeated field', function () {
    var result = convertFields([
      ['items[01]', 'named'],
      ['items', 'next']
    ]);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
      items: [{ '01': 'named' }, 'next']
    });
  });

  it('keeps canonical dense indexes as arrays', function () {
    var result = convertFields([
      ['items[1]', 'second'],
      ['items[0]', 'first']
    ]);

    assert.deepStrictEqual(result, { items: ['first', 'second'] });
  });
  it('serializes indexed values without modern number methods or collections', function() {
    var legacyUtils = loadLegacyModule(path.resolve(__dirname, '../../../lib/utils.js')).exports;
    var legacyToFormData = loadLegacyModule(
      path.resolve(__dirname, '../../../lib/helpers/toFormData.js'),
      {'../utils': legacyUtils}
    ).exports;
    var legacyFormDataToJSON = loadLegacyModule(
      path.resolve(__dirname, '../../../lib/helpers/formDataToJSON.js'),
      {'../utils': legacyUtils}
    ).exports;
    var values = {length: 2};
    Object.defineProperties(values, {
      0: {value: 'first'},
      1: {value: 'second'}
    });
    var entries = [];
    legacyToFormData({'items[]': values}, {
      append: function(name, value) {
        entries.push([name, value]);
      }
    });

    assert.deepStrictEqual(entries, [['items[]', 'first'], ['items[]', 'second']]);
    assert.strictEqual(JSON.stringify(legacyUtils.toArray('abc')), '["a","b","c"]');
    assert.strictEqual(legacyUtils.toArray({length: 1, label: 'value'}), null);
    [NaN, Infinity, -1, 1.5, '2'].forEach(function(length) {
      assert.strictEqual(legacyUtils.toArray({length: length}), null);
    });

    var form = Object.create({
      append: function() {},
      toString: function() { return '[object FormData]'; },
      entries: function() { return [['items[01]', 'value']][Symbol.iterator](); }
    });
    form[Symbol.iterator] = form.entries;
    assert.deepStrictEqual(JSON.parse(JSON.stringify(legacyFormDataToJSON(form))), {
      items: {'01': 'value'}
    });
  });

  it('keeps dense arrays when Object.keys returns indexes in reverse order', function() {
    var loaded = loadLegacyModule(path.resolve(__dirname, '../../../lib/helpers/formDataToJSON.js'));
    vm.runInContext(
      'var nativeKeys = Object.keys; Object.keys = function(value) { return nativeKeys(value).reverse(); };',
      loaded.context
    );
    var form = Object.create({
      append: function() {},
      toString: function() { return '[object FormData]'; },
      entries: function() {
        return [['items[1]', 'second'], ['items[0]', 'first']][Symbol.iterator]();
      }
    });
    form[Symbol.iterator] = form.entries;

    assert.deepStrictEqual(JSON.parse(JSON.stringify(loaded.exports(form))), {
      items: ['first', 'second']
    });
  });

  it('does not count indexes inherited only from Object.prototype', function() {
    var loaded = loadLegacyModule(path.resolve(__dirname, '../../../lib/utils.js'));
    var result = vm.runInContext(
      'Object.prototype[0] = "shared"; module.exports.toArray({length: 1});',
      loaded.context
    );
    assert.strictEqual(result, null);
  });

});
