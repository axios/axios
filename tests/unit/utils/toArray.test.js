import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

const { toArray } = utils;

describe('utils::kindOf', () => {
  it('should return object tag', () => {
    expect(toArray()).toEqual(null);
    expect(toArray([])).toEqual([]);
    expect(toArray([1])).toEqual([1]);
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
