import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

describe('utils::isX', () => {
  it('should validate Array', () => {
    expect(utils.isArray([])).toEqual(true);
    expect(utils.isArray({ length: 5 })).toEqual(false);
  });

  it('should validate ArrayBuffer', () => {
    expect(utils.isArrayBuffer(new ArrayBuffer(2))).toEqual(true);
    expect(utils.isArrayBuffer({})).toEqual(false);
  });

  it('should validate ArrayBufferView', () => {
    expect(utils.isArrayBufferView(new DataView(new ArrayBuffer(2)))).toEqual(true);
  });

  it('should validate FormData', () => {
    expect(utils.isFormData(new FormData())).toEqual(true);
  });

  it('should validate Blob', () => {
    expect(utils.isBlob(new Blob())).toEqual(true);
  });

  it('should validate String', () => {
    expect(utils.isString('')).toEqual(true);
    expect(
      utils.isString({
        toString: function () {
          return '';
        },
      })
    ).toEqual(false);
  });

  it('should validate Number', () => {
    expect(utils.isNumber(123)).toEqual(true);
    expect(utils.isNumber('123')).toEqual(false);
  });

  it('should validate Undefined', () => {
    expect(utils.isUndefined()).toEqual(true);
    expect(utils.isUndefined(null)).toEqual(false);
  });

  it('should validate Object', () => {
    expect(utils.isObject({})).toEqual(true);
    expect(utils.isObject([])).toEqual(true);
    expect(utils.isObject(null)).toEqual(false);
  });

  it('should validate plain Object', () => {
    expect(utils.isPlainObject({})).toEqual(true);
    expect(utils.isPlainObject([])).toEqual(false);
    expect(utils.isPlainObject(null)).toEqual(false);
    expect(utils.isPlainObject(Object.create({}))).toEqual(false);
  });

  it('should ignore inherited symbol properties when validating plain Object', () => {
    try {
      Object.prototype[Symbol.iterator] = function* () {
        yield ['x-injected', 'yes'];
      };
      Object.prototype[Symbol.toStringTag] = 'Custom';

      expect(utils.isPlainObject({})).toEqual(true);
      expect(utils.isPlainObject([])).toEqual(false);
      expect(
        utils.isPlainObject({
          [Symbol.iterator]: function* () {
            yield ['x-own', 'yes'];
          },
        })
      ).toEqual(false);
      expect(
        utils.isPlainObject({
          [Symbol.toStringTag]: 'Custom',
        })
      ).toEqual(false);
    } finally {
      delete Object.prototype[Symbol.iterator];
      delete Object.prototype[Symbol.toStringTag];
    }
  });

  it('should treat an object with a genuinely inherited iterator as non-plain', () => {
    // Iterator inherited from a custom (non-Object.prototype) source: this is a
    // real iterable, not prototype pollution, so it must not be classified plain.
    const proto = Object.create(null);
    proto[Symbol.iterator] = function* () {
      yield ['x', '1'];
    };

    expect(utils.isPlainObject(Object.create(proto))).toEqual(false);
  });

  it('should not read polluted Object.prototype iterator accessors for safe iterable checks', () => {
    let accessed = false;

    try {
      Object.defineProperty(Object.prototype, Symbol.iterator, {
        configurable: true,
        get() {
          accessed = true;
          throw new Error('polluted iterator accessor');
        }
      });

      expect(utils.isSafeIterable({})).toEqual(false);
      expect(accessed).toEqual(false);
    } finally {
      delete Object.prototype[Symbol.iterator];
    }
  });

  it('should stop safe prototype-chain reads on cyclic Proxy prototypes', () => {
    let calls = 0;
    let proxy;
    proxy = new Proxy({}, {
      getPrototypeOf() {
        calls += 1;
        if (calls > 5) {
          throw new Error('cycled');
        }
        return proxy;
      }
    });

    expect(utils.hasOwnInPrototypeChain(proxy, 'missing')).toEqual(false);
    expect(utils.getSafeProp(proxy, 'missing')).toEqual(undefined);
    expect(calls).toBeLessThanOrEqual(2);
  });

  it('should validate Date', () => {
    expect(utils.isDate(new Date())).toEqual(true);
    expect(utils.isDate(Date.now())).toEqual(false);
  });

  it('should validate Function', () => {
    expect(utils.isFunction(function () {})).toEqual(true);
    expect(utils.isFunction('function')).toEqual(false);
  });

  it('should validate URLSearchParams', () => {
    expect(utils.isURLSearchParams(new URLSearchParams())).toEqual(true);
    expect(utils.isURLSearchParams('foo=1&bar=2')).toEqual(false);
  });

  it('should validate TypedArray instance', () => {
    expect(utils.isTypedArray(new Uint8Array([1, 2, 3]))).toEqual(true);
    expect(utils.isTypedArray([1, 2, 3])).toEqual(false);
  });
});
