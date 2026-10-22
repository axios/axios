import { describe, it, expect } from 'vitest';
import AxiosURLSearchParams from '../../../lib/helpers/AxiosURLSearchParams.js';

describe('AxiosURLSearchParams::toString', () => {
  it('should pass the AxiosURLSearchParams instance as `this` to a custom encoder', () => {
    const params = new AxiosURLSearchParams({ foo: 'bar', baz: 'qux' });
    const capturedThis = [];

    const serialized = params.toString(function customEncoder(value, defaultEncode) {
      capturedThis.push(this);
      return defaultEncode(value);
    });

    expect(serialized).toBe('foo=bar&baz=qux');
    expect(capturedThis).toEqual([params, params, params, params]);
  });
});
