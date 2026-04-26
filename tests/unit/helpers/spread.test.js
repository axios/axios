import { describe, it, expect } from 'vitest';
import spread from '../../../lib/helpers/spread.js';

describe('helpers::spread', () => {
  it('should spread array to arguments', () => {
    let value = 0;
    spread((a, b) => {
      value = a * b;
    })([5, 10]);

    expect(value).toEqual(50);
  });

  it('should return callback result', () => {
    const value = spread((a, b) => {
      return a * b;
    })([5, 10]);

    expect(value).toEqual(50);
  });
});
