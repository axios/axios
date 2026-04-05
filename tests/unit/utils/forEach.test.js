import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

const { forEach } = utils;

describe('utils::forEach', () => {
  it('should loop over an array', () => {
    let sum = 0;

    forEach([1, 2, 3, 4, 5], (val) => {
      sum += val;
    });

    expect(sum).toEqual(15);
  });

  it('should loop over object keys', () => {
    let keys = '';
    let vals = 0;
    const obj = {
      b: 1,
      a: 2,
      r: 3,
    };

    forEach(obj, (v, k) => {
      keys += k;
      vals += v;
    });

    expect(keys).toEqual('bar');
    expect(vals).toEqual(6);
  });

  it('should handle undefined gracefully', () => {
    let count = 0;

    forEach(undefined, () => {
      count++;
    });

    expect(count).toEqual(0);
  });

  it('should make an array out of non-array argument', () => {
    let count = 0;

    forEach(
      () => {},
      () => {
        count++;
      }
    );

    expect(count).toEqual(1);
  });

  it('should handle non object prototype gracefully', () => {
    let count = 0;
    const data = Object.create(null);
    data.foo = 'bar';

    forEach(data, () => {
      count++;
    });

    expect(count).toEqual(1);
  });
});
