import { describe, it, expect } from 'vitest';
import AxiosHeaders from '../../../lib/core/AxiosHeaders.js';

describe('AxiosHeaders iterable input', () => {
  for (const [name, makeIterable] of [
    ['array', (entries) => entries],
    ['Map', (entries) => new Map(entries)],
    ['Set', (entries) => new Set(entries)],
  ]) {
    it(`combines case-insensitive duplicates from ${name}`, () => {
      const headers = new AxiosHeaders();
      headers.set(makeIterable([['X-Item', 'first'], ['x-item', 'second'], ['X-ITEM', 'third']]));
      expect(headers.get('x-item')).toEqual(['first', 'second', 'third']);
      expect(Object.keys(headers.toJSON())).toEqual(['X-Item']);
    });
  }

  it('keeps rewrite controls for already stored headers', () => {
    const headers = new AxiosHeaders({ 'X-Item': 'original', Disabled: false });
    const entries = [['x-item', 'first'], ['X-ITEM', 'second'], ['disabled', 'enabled']];
    headers.set(entries, false);
    expect(headers.get('x-item')).toBe('original');
    expect(headers.get('disabled')).toBe(false);
    headers.set(entries, true);
    expect(headers.get('x-item')).toEqual(['first', 'second']);
    expect(headers.get('disabled')).toBe('enabled');
  });

  it('keeps ordinary object replacement semantics', () => {
    const headers = new AxiosHeaders({ 'X-Item': 'first', 'x-item': 'second' });
    expect(headers.get('x-item')).toBe('second');
  });

  it('keeps prototype-like names as ordinary header entries', () => {
    const headers = new AxiosHeaders();
    headers.set([['__proto__', 'first'], ['__PROTO__', 'second']]);
    expect(headers.get('__proto__')).toEqual(['first', 'second']);
    expect(Object.getPrototypeOf(headers)).toBe(AxiosHeaders.prototype);
  });

  it('preserves coercion of numeric keys and ignores symbol keys', () => {
    const headers = new AxiosHeaders();
    headers.set([[123, 'number'], [Symbol('header'), 'ignored']]);
    expect(headers.toJSON()).toEqual({ 123: 'number' });
  });
});
