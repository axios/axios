import { describe, it, expect } from 'vitest';
import AxiosURLSearchParams from '../../../lib/helpers/AxiosURLSearchParams.js';

describe('AxiosURLSearchParams::toString', () => {
  it('should pass the AxiosURLSearchParams instance as `this` to a custom encoder', () => {
    const params = new AxiosURLSearchParams({ foo: 'bar', baz: 'qux' });
    let capturedThis;

    params.toString(function customEncoder(value, defaultEncode) {
      capturedThis = this;
      return defaultEncode(value);
    });

    expect(capturedThis).toBe(params);
  });
});
