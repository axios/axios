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

  ['omitted', 'unsupported'].forEach(function(reflection) {
    it('serializes FileList values when indexed reflection is ' + reflection, function() {
      var files = Object.create({});
      Object.defineProperty(files, Symbol.toStringTag, {value: 'FileList'});
      Object.defineProperties(files, {
        0: {value: 'first'},
        1: {value: 'second', configurable: true},
        length: {value: 2}
      });
      var loaded = loadLegacyModule(path.resolve(__dirname, '../../../lib/utils.js'));
      loaded.context.files = files;
      vm.runInContext([
        'var reflectionCalls = 0;',
        'var nativeNames = Object.getOwnPropertyNames;',
        'Object.getOwnPropertyNames = function(value) {',
        '  if (value === files) {',
        '    reflectionCalls++;',
        reflection === 'omitted' ? '    return ["length"];' : '    throw new TypeError("Unsupported host object");',
        '  }',
        '  return nativeNames(value);',
        '};'
      ].join('\n'), loaded.context);
      var legacyUtils = loaded.exports;
      var legacyToFormData = loadLegacyModule(
        path.resolve(__dirname, '../../../lib/helpers/toFormData.js'),
        {'../utils': legacyUtils}
      ).exports;
      var legacyDefaults = loadLegacyModule(
        path.resolve(__dirname, '../../../lib/defaults/index.js'),
        {'../utils': legacyUtils, '../helpers/toFormData': legacyToFormData}
      ).exports;
      function FormRecorder() {
        this.parts = [];
      }
      FormRecorder.prototype.append = function(name, value) {
        this.parts.push([name, value]);
      };

      assert.deepStrictEqual(JSON.parse(JSON.stringify(legacyUtils.toArray(files))), ['first', 'second']);
      ['uploads', 'uploads[]'].forEach(function(key) {
        var fields = {};
        fields[key] = files;
        var form = legacyToFormData(fields, new FormRecorder());
        assert.deepStrictEqual(form.parts, [['uploads[]', 'first'], ['uploads[]', 'second']]);
      });
      var transformed = legacyDefaults.transformRequest[0].call({env: {FormData: FormRecorder}}, files, {});
      assert.deepStrictEqual(transformed.parts, [['files[]', 'first'], ['files[]', 'second']]);
      delete files[1];
      assert.strictEqual(legacyUtils.toArray(files), null);
      assert.strictEqual(loaded.context.reflectionCalls, 0);
    });
  });

  ['first', 'last', 'undefined', 'null'].forEach(function(missing) {
    it('does not unwrap incomplete FileList values (' + missing + ')', function() {
      var files = {0: 'first', 1: 'second', length: 2};
      Object.defineProperty(files, Symbol.toStringTag, {value: 'FileList'});
      if (missing === 'first' || missing === 'last') {
        delete files[missing === 'first' ? 0 : 1];
      } else {
        files[1] = missing === 'null' ? null : undefined;
      }

      assert.strictEqual(utils.toArray(files), null);
      var entries = [];
      toFormData({'files[]': files}, {
        append: function(name, value) { entries.push([name, value]); }
      });
      // Keep the normal unconverted-value path instead of emitting a partial list.
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0][0], 'files[]');
      assert.strictEqual(entries[0][1], files);
    });
  });

  it('reads each FileList entry once and accepts empty collections', function() {
    var reads = 0;
    var files = {length: 1};
    Object.defineProperty(files, Symbol.toStringTag, {value: 'FileList'});
    Object.defineProperty(files, '0', {
      get: function() { reads++; return reads === 1 ? 'first' : undefined; }
    });

    assert.deepStrictEqual(utils.toArray(files), ['first']);
    assert.strictEqual(reads, 1);
    files.length = 0;
    assert.deepStrictEqual(utils.toArray(files), []);
    assert.strictEqual(reads, 1);
  });

  it('validates FileList lengths before reading their indexed values', function() {
    [NaN, Infinity, -1, 1.5, '2', 4294967296].forEach(function(length) {
      var reads = 0;
      var files = {length: length};
      Object.defineProperty(files, Symbol.toStringTag, {value: 'FileList'});
      Object.defineProperty(files, '0', {
        get: function() { reads++; return 'first'; }
      });

      assert.strictEqual(utils.toArray(files), null);
      assert.strictEqual(reads, 0);
    });
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

  it('unwraps own and hidden indexes inherited from a null-prototype parent', function() {
    var prototype = Object.create(null);
    Object.defineProperty(prototype, '1', {value: 'second'});
    prototype[2] = 'third';
    var values = Object.create(prototype);
    values[0] = 'first';
    values.length = 3;

    assert.deepStrictEqual(utils.toArray(values), ['first', 'second', 'third']);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'], ['items[]', 'second'], ['items[]', 'third']
    ]);
  });

  it('unwraps indexes across multiple levels ending in a null prototype', function() {
    var terminal = Object.create(null);
    Object.defineProperty(terminal, '2', {value: 'third'});
    var middle = Object.create(terminal);
    Object.defineProperty(middle, '1', {value: 'second'});
    var values = Object.create(middle);
    values[0] = 'first';
    values.length = 3;

    assert.deepStrictEqual(utils.toArray(values), ['first', 'second', 'third']);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'], ['items[]', 'second'], ['items[]', 'third']
    ]);
  });

  it('does not invoke an inherited constructor accessor while collecting indexes', function() {
    var reads = 0;
    var prototype = Object.create(null);
    Object.defineProperty(prototype, 'constructor', {
      get: function() { reads++; return Object; }
    });
    prototype[0] = 'first';
    var values = Object.create(prototype);
    values.length = 1;

    assert.deepStrictEqual(utils.toArray(values), ['first']);
    assert.strictEqual(reads, 0);
  });

  it('unwraps indexes inherited from a foreign null-prototype parent', function() {
    var values = vm.runInNewContext([
      'var prototype = Object.create(null);',
      'Object.defineProperty(prototype, "1", {value: "second"});',
      'var values = Object.create(prototype);',
      'values[0] = "first"; values.length = 2; values;'
    ].join('\n'));

    assert.deepStrictEqual(utils.toArray(values), ['first', 'second']);
  });

  it('does not count indexes inherited from a foreign Object.prototype', function() {
    var values = vm.runInNewContext([
      'Object.defineProperty(Object.prototype, "0", {value: "shared"});',
      '({length: 1});'
    ].join('\n'));

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
