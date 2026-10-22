import { describe, it } from 'vitest';
import assert from 'assert';
import utils from '../../../lib/utils.js';
import toFormData from '../../../lib/helpers/toFormData.js';
import formDataToJSON from '../../../lib/helpers/formDataToJSON.js';

function multipartEntries(value) {
  var entries = [];
  toFormData(
    { 'items[]': value },
    {
      append: function (name, part) {
        entries.push([name, String(part)]);
      },
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
    },
  });
  fields[Symbol.iterator] = fields.entries;
  return formDataToJSON(fields);
}

describe('indexed multipart fields', function () {
  it('unwraps non-enumerable indexes', function () {
    var values = { length: 2 };
    Object.defineProperties(values, {
      0: { value: 'first' },
      1: { value: 'second' },
    });

    assert.deepStrictEqual(utils.toArray(values), ['first', 'second']);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'],
      ['items[]', 'second'],
    ]);
  });

  it('unwraps present sparse array values under an array key', function () {
    var values = new Array(4);
    values[1] = 'first';
    values[3] = 'second';

    assert.strictEqual(utils.toArray(values), values);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'],
      ['items[]', 'second'],
    ]);
  });

  it('unwraps prototype-backed indexes without counting duplicates twice', function () {
    var prototype = {};
    Object.defineProperties(prototype, {
      0: { value: 'inherited', configurable: true },
      1: { value: 'second' },
    });
    var values = Object.create(prototype, {
      0: { value: 'first' },
      length: { value: 2, writable: true },
    });

    assert.deepStrictEqual(multipartEntries(values), [
      ['items[]', 'first'],
      ['items[]', 'second'],
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
      },
    });
    var values = Object.create(prototype, {
      0: { value: 'first' },
      1: { value: 'second' },
    });
    assert.deepStrictEqual(utils.toArray(values), ['first', 'second']);
  });

  it('does not fill an index gap from unrelated fields', function () {
    var values = { 0: 'first', length: 2, label: 'x' };

    assert.strictEqual(utils.toArray(values), null);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[0]', 'first'],
      ['items[length]', '2'],
      ['items[label]', 'x'],
    ]);
  });

  it('keeps unrelated fields when indexed values are absent', function () {
    var values = { length: 1, label: 'x' };

    assert.strictEqual(utils.toArray(values), null);
    assert.deepStrictEqual(multipartEntries(values), [
      ['items[length]', '1'],
      ['items[label]', 'x'],
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
    [100000, 4294967296, Number.MAX_SAFE_INTEGER].forEach(function (length) {
      var reads = 0;
      var values = { length: length, label: 'x' };
      Object.defineProperty(values, '0', {
        get: function () {
          reads++;
          return 'first';
        },
      });

      assert.strictEqual(utils.toArray(values), null);
      assert.strictEqual(reads, 0);
    });
  });

  ['01', '-0', '-1', '+1', '1e0', '4294967295', '9007199254740992'].forEach(function (key) {
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
      ['items[01]', 'named'],
    ]);
    var expected = { items: { 1: 'second', '01': 'named' } };

    assert.deepStrictEqual(result, expected);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), expected);
  });

  it('retains dense indexes together with non-index properties', function () {
    var result = convertFields([
      ['items[0]', 'first'],
      ['items[01]', 'named'],
    ]);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
      items: { 0: 'first', '01': 'named' },
    });
  });

  it('normalizes non-index properties before appending a repeated field', function () {
    var result = convertFields([
      ['items[01]', 'named'],
      ['items', 'next'],
    ]);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), {
      items: [{ '01': 'named' }, 'next'],
    });
  });

  it('keeps canonical dense indexes as arrays', function () {
    var result = convertFields([
      ['items[1]', 'second'],
      ['items[0]', 'first'],
    ]);

    assert.deepStrictEqual(result, { items: ['first', 'second'] });
  });
});
