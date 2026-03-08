import { describe, it, expect } from 'vitest';
import { kindOfTest } from '../../../lib/utils.js';

describe('utils::kindOfTest', () => {
  it('should return true if the type is matched', () => {
    const test = kindOfTest('number');

    expect(test(123)).toEqual(true);
    expect(test('123')).toEqual(false);
  });
});
