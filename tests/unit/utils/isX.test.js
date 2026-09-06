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

  it('should ignore an iterator inherited from a terminal null-prototype boundary', () => {
    // A terminal application template is indistinguishable from a mutated
    // foreign Object.prototype, so its inherited members fail closed.
    const proto = Object.create(null);
    proto[Symbol.iterator] = function* () {
      yield ['x', '1'];
    };

    const value = Object.create(proto);

    expect(utils.isPlainObject(value)).toEqual(true);
    expect(utils.isSafeIterable(value)).toEqual(false);
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

  it('should stop safe prototype flattening on cyclic Proxy prototypes', () => {
    let calls = 0;
    let proxy;
    proxy = new Proxy({}, {
      getPrototypeOf() {
        calls += 1;
        if (calls > 1) {
          throw new Error('cycled');
        }
        return proxy;
      }
    });

    expect(Object.keys(utils.toSafeFlatObject(proxy))).toEqual([]);
    expect(calls).toEqual(1);
  });

  it('should preserve null-prototype sources but exclude terminal templates', () => {
    const root = Object.create(null);
    root.own = 'preserved';

    expect(utils.getSafeProp(root, 'own')).toEqual('preserved');
    expect(utils.toSafeFlatObject(root)).toBe(root);

    const template = Object.create(null);
    template.inherited = 'excluded';

    const source = Object.create(template);
    source.own = 'preserved';

    expect(utils.getSafeProp(source, 'own')).toEqual('preserved');
    expect(utils.getSafeProp(source, 'inherited')).toEqual(undefined);

    const flattened = utils.toSafeFlatObject(source);

    expect(flattened.own).toEqual('preserved');
    expect(Object.prototype.hasOwnProperty.call(flattened, 'inherited')).toEqual(false);
  });

  it('should materialize immutable null-prototype sources', () => {
    const source = Object.freeze(Object.assign(Object.create(null), { own: 'preserved' }));
    const flattened = utils.toSafeFlatObject(source);

    expect(flattened).not.toBe(source);
    expect(Object.getPrototypeOf(flattened)).toEqual(null);
    expect(flattened.own).toEqual('preserved');
    expect(Object.isFrozen(flattened)).toEqual(false);
  });

  it('should materialize and filter unsafe keys from null-prototype sources', () => {
    const source = Object.create(null);
    source.safe = 'preserved';
    Object.defineProperty(source, '__proto__', {
      value: 'excluded',
      enumerable: true,
      configurable: true,
      writable: true,
    });
    source.constructor = 'excluded';
    source.prototype = 'excluded';

    const flattened = utils.toSafeFlatObject(source);

    expect(flattened).not.toBe(source);
    expect(flattened.safe).toEqual('preserved');
    expect(Object.prototype.hasOwnProperty.call(flattened, '__proto__')).toEqual(false);
    expect(Object.prototype.hasOwnProperty.call(flattened, 'constructor')).toEqual(false);
    expect(Object.prototype.hasOwnProperty.call(flattened, 'prototype')).toEqual(false);
  });

  it('should exclude symbols inherited from terminal null-prototype templates', () => {
    const behavior = Symbol('behavior');
    const template = Object.create(null);
    template[behavior] = () => 'excluded';

    const source = Object.create(template);
    const flattened = utils.toSafeFlatObject(source);

    expect(utils.getSafeProp(source, behavior)).toEqual(undefined);
    expect(Object.prototype.hasOwnProperty.call(flattened, behavior)).toEqual(false);
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

  describe('isPlainObject prototype boundaries', () => {
    const withPollutedObjectPrototype = (symbol, descriptor, fn) => {
      const original = Object.getOwnPropertyDescriptor(Object.prototype, symbol);

      try {
        Object.defineProperty(Object.prototype, symbol, descriptor);
        fn();
      } finally {
        if (original) {
          Object.defineProperty(Object.prototype, symbol, original);
        } else {
          delete Object.prototype[symbol];
        }
      }
    };

    it('should treat Object.prototype itself as a plain object', () => {
      expect(utils.isPlainObject(Object.prototype)).toEqual(true);
    });

    it('should keep Object.prototype a fail-closed boundary when it carries an own Symbol.iterator', () => {
      withPollutedObjectPrototype(
        Symbol.iterator,
        { value: undefined, configurable: true, writable: true },
        () => {
          expect(utils.isPlainObject(Object.prototype)).toEqual(true);
          expect(utils.isPlainObject({})).toEqual(true);
          expect(utils.isPlainObject(Object.create(null))).toEqual(true);
          expect(utils.isPlainObject({ [Symbol.iterator]: function* () {} })).toEqual(false);
        }
      );
    });

    it('should keep Object.prototype a fail-closed boundary when it carries an own Symbol.toStringTag', () => {
      withPollutedObjectPrototype(
        Symbol.toStringTag,
        { value: 'Custom', configurable: true, writable: true },
        () => {
          expect(utils.isPlainObject(Object.prototype)).toEqual(true);
          expect(utils.isPlainObject({})).toEqual(true);
          expect(utils.isPlainObject(Object.create(null))).toEqual(true);
          expect(utils.isPlainObject({ [Symbol.toStringTag]: 'Own' })).toEqual(false);
        }
      );
    });

    it('should not read a polluted Object.prototype iterator accessor', () => {
      let accessed = false;

      withPollutedObjectPrototype(
        Symbol.iterator,
        {
          configurable: true,
          get() {
            accessed = true;
            throw new Error('polluted iterator accessor');
          },
        },
        () => {
          expect(utils.isPlainObject({})).toEqual(true);
          expect(utils.isPlainObject(Object.prototype)).toEqual(true);
          expect(accessed).toEqual(false);
        }
      );
    });

    it('should reject own symbol members on null-prototype objects', () => {
      const tagged = Object.create(null);
      tagged[Symbol.toStringTag] = 'Tagged';
      const iterable = Object.create(null);
      iterable[Symbol.iterator] = function* () {};

      expect(utils.isPlainObject(Object.create(null))).toEqual(true);
      expect(utils.isPlainObject(tagged)).toEqual(false);
      expect(utils.isPlainObject(iterable)).toEqual(false);
    });

    it('should ignore symbol members inherited from a terminal null-prototype parent', () => {
      const parent = Object.create(null);
      parent[Symbol.toStringTag] = 'Parent';
      parent[Symbol.iterator] = function* () {};
      const child = Object.create(parent);
      const ownIterable = Object.create(parent);
      ownIterable[Symbol.iterator] = function* () {};

      expect(utils.isPlainObject(child)).toEqual(true);
      expect(utils.isPlainObject(ownIterable)).toEqual(false);
    });

    it('should reject class instances, deeper prototype chains and built-ins', () => {
      class Klass {}

      expect(utils.isPlainObject(new Klass())).toEqual(false);
      expect(utils.isPlainObject(Object.create(Object.create(null)))).toEqual(true);
      expect(utils.isPlainObject(Object.create(Object.create({})))).toEqual(false);
      expect(utils.isPlainObject([])).toEqual(false);
      expect(utils.isPlainObject(new Map())).toEqual(false);
      expect(utils.isPlainObject(Buffer.from('x'))).toEqual(false);
      expect(utils.isPlainObject(Object.freeze({}))).toEqual(true);
    });
  });
});
