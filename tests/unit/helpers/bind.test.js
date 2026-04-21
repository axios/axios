import { describe, it, expect } from 'vitest';
import bind from '../../../lib/helpers/bind.js';

describe('bind', () => {
  it('should bind an object to a function', () => {
    const o = { val: 123 };
    const f = bind(function (num) {
      return this.val * num;
    }, o);

    expect(f(2)).toEqual(246);
  });
});
