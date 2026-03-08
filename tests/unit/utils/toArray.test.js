import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

const { toArray } = utils;

describe('utils::toArray', () => {
  it('should return null or an array copy depending on input', () => {
    expect(toArray()).toEqual(null);
    expect(toArray([])).toEqual([]);
    expect(toArray([1])).toEqual([1]);
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
