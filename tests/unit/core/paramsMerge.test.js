import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import mergeConfig from '../../../lib/core/mergeConfig.js';
import buildURL from '../../../lib/helpers/buildURL.js';

function nest(depth) {
  let result = { leaf: 'value' };
  while (depth--) result = { next: result };
  return result;
}

function leaf(params) {
  let result = params;
  while (result.next) result = result.next;
  return result.leaf;
}

describe('params merge', function () {
  [null, false, 'replacement', ['replacement']].forEach(function (params) {
    it('replaces deep defaults with ' + String(params), function () {
      const defaults = { params: nest(150) };
      const merged = mergeConfig(defaults, { params });
      assert.deepStrictEqual(merged.params, params);
      assert.strictEqual(leaf(defaults.params), 'value');
    });
  });

  it('replaces deep nested defaults while retaining sibling fields', function () {
    const params = { page: 1, filters: { deep: nest(150), active: true } };
    const merged = mergeConfig({ params }, { params: { filters: { deep: null } } });
    assert.deepStrictEqual(merged.params, {
      page: 1,
      filters: { deep: null, active: true },
    });
    assert.strictEqual(leaf(params.filters.deep), 'value');
  });

  it('does not read default branches replaced by request values', function () {
    const params = { retained: true };
    Object.defineProperty(params, 'replaced', {
      enumerable: true,
      get: function () {
        throw new Error('discarded default should not be read');
      },
    });
    assert.deepStrictEqual(mergeConfig({ params }, { params: { replaced: null } }).params, {
      retained: true,
      replaced: null,
    });
  });

  it('allows a replacement to remove a default cycle', function () {
    const params = { retained: true };
    params.next = params;
    assert.deepStrictEqual(mergeConfig({ params }, { params: { next: { next: null } } }).params, {
      retained: true,
      next: { retained: true, next: null },
    });
    assert.strictEqual(mergeConfig({ params }, { params: null }).params, null);
  });

  it('copies deep params iteratively for a custom serializer', function () {
    const params = nest(512);
    const merged = mergeConfig({}, { params });
    assert.notStrictEqual(merged.params, params);
    let source = params;
    let target = merged.params;
    while (source.next) {
      assert.notStrictEqual(target.next, source.next);
      target = target.next;
      source = source.next;
    }
    assert.strictEqual(target.leaf, 'value');
    assert.strictEqual(
      axios.getUri({ url: '/resource', params, paramsSerializer: () => 'accepted=true' }),
      '/resource?accepted=true'
    );
  });

  it('retains nested merge, array-copy, undefined, and symbol behavior', function () {
    const symbol = Symbol('field');
    const array = [{ value: 'shared array element' }];
    const merged = mergeConfig(
      { params: { nested: { a: 1, b: 2 }, removed: 1, array, [symbol]: { a: 1 } } },
      { params: { nested: { b: 3 }, removed: undefined, [symbol]: { b: 2 } } }
    ).params;
    assert.deepStrictEqual(merged.nested, { a: 1, b: 3 });
    assert.strictEqual(Object.prototype.hasOwnProperty.call(merged, 'removed'), true);
    assert.strictEqual(merged.removed, undefined);
    assert.notStrictEqual(merged.array, array);
    assert.strictEqual(merged.array[0], array[0]);
    assert.deepStrictEqual(merged[symbol], { a: 1, b: 2 });
  });

  it('filters reserved merge keys at every object level', function () {
    const params = JSON.parse(
      '{"nested":{"__proto__":{"ignored":true},"constructor":"ignored","prototype":"ignored","kept":1}}'
    );
    assert.deepStrictEqual(mergeConfig({}, { params }).params, { nested: { kept: 1 } });
  });

  it('ignores symbols whose proxy descriptor is absent', function () {
    const symbol = Symbol('absent');
    const params = new Proxy(
      { field: 'value' },
      {
        ownKeys: function () {
          return ['field', symbol];
        },
      }
    );
    assert.deepStrictEqual(mergeConfig({}, { params }).params, { field: 'value' });
    assert.strictEqual(mergeConfig({}, { params: [params] }).params[0], params);
  });

  it('rejects retained cycles, including through arrays, with an AxiosError', function () {
    const object = {};
    object.next = object;
    const array = [];
    array.push(array);
    [object, array, { list: array }].forEach(function (params) {
      assert.throws(
        () => mergeConfig({}, { params, paramsSerializer: { maxDepth: Infinity } }),
        (error) => error.isAxiosError === true && error.code === 'ERR_BAD_OPTION_VALUE'
      );
    });
  });

  ['constructor', 'prototype', '__proto__'].forEach(function (key) {
    it('preserves retained ' + key + ' accessors without reading them', async function () {
      const element = { field: 'value' };
      let reads = 0;
      const get = function () {
        reads++;
        throw new Error('Reserved accessor must not run during merging');
      };
      Object.defineProperty(element, key, { get, enumerable: true });
      const params = { list: [element] };
      let serializerCalls = 0;
      const paramsSerializer = function (merged) {
        serializerCalls++;
        assert.strictEqual(merged.list[0], element);
        assert.strictEqual(Object.getOwnPropertyDescriptor(merged.list[0], key).get, get);
        assert.strictEqual(reads, 0);
        return 'field=' + merged.list[0].field;
      };

      assert.strictEqual(
        axios.getUri({ url: '/resource', params, paramsSerializer }),
        '/resource?field=value'
      );
      const response = await axios.get('/resource', {
        params,
        paramsSerializer,
        adapter: function (config) {
          return Promise.resolve({
            data: buildURL(config.url, config.params, config.paramsSerializer),
            status: 200,
            headers: {},
            config,
          });
        },
      });
      assert.strictEqual(response.data, '/resource?field=value');
      assert.strictEqual(serializerCalls, 2);
      assert.strictEqual(reads, 0);
      assert.strictEqual(Object.getOwnPropertyDescriptor(element, key).get, get);
    });

    it('rejects retained ' + key + ' cycles before serializers or adapters run', async function () {
      const element = {};
      Object.defineProperty(element, key, { value: element, enumerable: true });
      const params = { list: [element] };
      let serializerCalls = 0;
      let adapterCalls = 0;
      const paramsSerializer = function () {
        serializerCalls++;
        return 'recorded=true';
      };
      const isCircularParamsError = function (error) {
        return error.isAxiosError === true && error.code === 'ERR_BAD_OPTION_VALUE';
      };

      assert.throws(
        () => axios.getUri({ url: '/resource', params, paramsSerializer }),
        isCircularParamsError
      );
      await assert.rejects(
        axios.get('/resource', {
          params,
          paramsSerializer,
          adapter: function (config) {
            adapterCalls++;
            return Promise.resolve({ data: 'recorded', status: 200, headers: {}, config });
          },
        }),
        isCircularParamsError
      );
      assert.strictEqual(serializerCalls, 0);
      assert.strictEqual(adapterCalls, 0);
      assert.strictEqual(params.list[0], element);
      assert.strictEqual(Object.getOwnPropertyDescriptor(element, key).value, element);
      assert.strictEqual(Object.getPrototypeOf(element), Object.prototype);
    });

    it('preserves acyclic ' + key + ' fields and shared array references', function () {
      const shared = { leaf: 'value' };
      const element = { other: shared };
      Object.defineProperty(element, key, { value: shared, enumerable: true });
      const params = { list: [element, element] };
      let serializerCalls = 0;
      const uri = axios.getUri({
        url: '/resource',
        params,
        paramsSerializer: function (merged) {
          serializerCalls++;
          assert.notStrictEqual(merged.list, params.list);
          assert.strictEqual(merged.list[0], element);
          assert.strictEqual(merged.list[1], element);
          assert.strictEqual(Object.getOwnPropertyDescriptor(merged.list[0], key).value, shared);
          assert.strictEqual(merged.list[0].other, shared);
          return 'recorded=true';
        },
      });
      assert.strictEqual(uri, '/resource?recorded=true');
      assert.strictEqual(serializerCalls, 1);
      assert.strictEqual(Object.getPrototypeOf(element), Object.prototype);
    });
  });

  it('allows shared values that are not circular', function () {
    const shared = { leaf: 'value' };
    assert.deepStrictEqual(
      mergeConfig({}, { params: { first: shared, second: { child: shared } } }).params,
      { first: shared, second: { child: shared } }
    );
  });
});

describe('params serializer depth settings', function () {
  [200, Infinity].forEach(function (maxDepth) {
    it('honors request and instance maxDepth ' + maxDepth, async function () {
      const params = nest(150);
      const instance = axios.create({ paramsSerializer: { maxDepth } });
      const expected = buildURL('/resource', params, { maxDepth });
      assert.strictEqual(instance.getUri({ url: '/resource', params }), expected);
      assert.strictEqual(
        axios.getUri({ url: '/resource', params, paramsSerializer: { maxDepth } }),
        expected
      );
      const response = await instance.get('/resource', {
        params,
        adapter: function (config) {
          return Promise.resolve({
            data: buildURL(config.url, config.params, config.paramsSerializer),
            status: 200,
            headers: {},
            config,
          });
        },
      });
      assert.strictEqual(response.data, expected);
    });
  });

  it('retains default and lowered serializer depth limits', function () {
    [undefined, { maxDepth: 5 }].forEach(function (paramsSerializer) {
      assert.throws(
        () => axios.getUri({ url: '/resource', params: nest(150), paramsSerializer }),
        (error) => error.code === 'ERR_FORM_DATA_DEPTH_EXCEEDED'
      );
    });
  });

  it('honors instance custom serializers in method aliases', async function () {
    const serialize = function (params) {
      assert.strictEqual(leaf(params), 'value');
      return 'custom=value';
    };
    for (const paramsSerializer of [serialize, { serialize }]) {
      const instance = axios.create({ paramsSerializer });
      const response = await instance.get('/resource', {
        params: nest(150),
        adapter: function (config) {
          return Promise.resolve({
            data: buildURL(config.url, config.params, config.paramsSerializer),
            status: 200,
            headers: {},
            config,
          });
        },
      });
      assert.strictEqual(response.data, '/resource?custom=value');
    }
  });

  it('allows custom adapters to accept params without serializing them', async function () {
    const response = await axios.get('/resource', {
      params: nest(150),
      adapter: function (config) {
        return Promise.resolve({ data: leaf(config.params), status: 200, headers: {}, config });
      },
    });
    assert.strictEqual(response.data, 'value');
  });
});
