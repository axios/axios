import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

const { kindOf } = utils;

describe('utils::kindOf', () => {
  it('should return object tag', () => {
    expect(kindOf({})).toEqual('object');
    // cached result
    expect(kindOf({})).toEqual('object');
    expect(kindOf([])).toEqual('array');
  });
});
