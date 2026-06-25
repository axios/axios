import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

const { merge } = utils;

describe('utils::merge', () => {
  it('should be immutable', () => {
    const a = {};
    const b = { foo: 123 };
    const c = { bar: 456 };

    merge(a, b, c);

    expect(typeof a.foo).toEqual('undefined');
    expect(typeof a.bar).toEqual('undefined');
    expect(typeof b.bar).toEqual('undefined');
    expect(typeof c.foo).toEqual('undefined');
  });

  it('should merge properties', () => {
    const a = { foo: 123 };
    const b = { bar: 456 };
    const c = { foo: 789 };
    const d = merge(a, b, c);

    expect(d.foo).toEqual(789);
    expect(d.bar).toEqual(456);
  });

  it('should merge recursively', () => {
    const a = { foo: { bar: 123 } };
    const b = { foo: { baz: 456 }, bar: { qux: 789 } };

    expect(merge(a, b)).toEqual({
      foo: {
        bar: 123,
        baz: 456,
      },
      bar: {
        qux: 789,
      },
    });
  });

  it('should remove all references from nested objects', () => {
    const a = { foo: { bar: 123 } };
    const b = {};
    const d = merge(a, b);

    expect(d).toEqual({
      foo: {
        bar: 123,
      },
    });

    expect(d.foo).not.toBe(a.foo);
  });

  it('handles null and undefined arguments', () => {
    expect(merge(undefined, undefined)).toEqual({});
    expect(merge(undefined, { foo: 123 })).toEqual({ foo: 123 });
    expect(merge({ foo: 123 }, undefined)).toEqual({ foo: 123 });

    expect(merge(null, null)).toEqual({});
    expect(merge(null, { foo: 123 })).toEqual({ foo: 123 });
    expect(merge({ foo: 123 }, null)).toEqual({ foo: 123 });
  });

  it('should replace properties with null', () => {
    expect(merge({}, { a: null })).toEqual({ a: null });
    expect(merge({ a: null }, {})).toEqual({ a: null });
  });

  it('should replace properties with arrays', () => {
    expect(merge({}, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3] });
    expect(merge({ a: 2 }, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3] });
    expect(merge({ a: { b: 2 } }, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3] });
  });

  it('should replace properties with cloned arrays', () => {
    const a = [1, 2, 3];
    const d = merge({}, { a });

    expect(d).toEqual({ a: [1, 2, 3] });
    expect(d.a).not.toBe(a);
  });

  it('should support caseless option', () => {
    const a = { x: 1 };
    const b = { X: 2 };
    const merged = merge.call({ caseless: true }, a, b);

    expect(merged).toEqual({
      x: 2,
    });
  });

  it('should merge enumerable symbol keys', () => {
    const key = Symbol('key');
    const nestedKey = Symbol('nested');
    const first = { [key]: { first: true } };
    const second = {
      [key]: { second: true },
      nested: {
        [nestedKey]: 'value',
      },
    };
    const merged = merge(first, second);

    expect(merged[key]).toEqual({ first: true, second: true });
    expect(merged[key]).not.toBe(first[key]);
    expect(merged.nested[nestedKey]).toBe('value');
    expect(merged.nested).not.toBe(second.nested);
  });

  it('should skip non-enumerable symbol keys', () => {
    const key = Symbol('key');
    const source = {};

    Object.defineProperty(source, key, {
      value: 'hidden',
      enumerable: false,
    });

    const merged = merge(source);

    expect(merged[key]).toBeUndefined();
    expect(Object.getOwnPropertySymbols(merged)).toEqual([]);
  });

  it('should support caseless string keys with symbol keys', () => {
    const key = Symbol('key');
    const merged = merge.call(
      { caseless: true },
      { x: 1, [key]: 'first' },
      { X: 2, [key]: 'second' }
    );

    expect(merged.x).toBe(2);
    expect(merged.X).toBeUndefined();
    expect(merged[key]).toBe('second');
  });

  it('should ignore symbol keys on buffers', () => {
    const key = Symbol('key');
    const buffer = Buffer.from('value');
    buffer[key] = 'symbol value';

    const merged = merge({ x: 1 }, buffer);

    expect(merged).toEqual({ x: 1 });
  });

  it('should ignore symbol keys on arrays', () => {
    const key = Symbol('key');
    const array = ['value'];
    array[key] = 'symbol value';

    const merged = merge({ x: 1 }, array);

    expect(merged).toEqual({ 0: 'value', x: 1 });
    expect(merged[key]).toBeUndefined();
  });

  it('should honor skipUndefined for symbol keys', () => {
    const key = Symbol('key');
    const merged = merge.call({ skipUndefined: true }, { [key]: 'first' }, { [key]: undefined });

    expect(merged[key]).toBe('first');
  });
});
