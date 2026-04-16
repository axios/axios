import { describe, expect, it } from 'vitest';

import toFormData from '../../lib/helpers/toFormData.js';

describe('helpers::toFormData (vitest browser)', () => {
  it('converts nested data object to FormData with dots option enabled', () => {
    const data = {
      val: 123,
      nested: {
        arr: ['hello', 'world'],
      },
    };

    const form = toFormData(data, null, { dots: true });

    expect(form).toBeInstanceOf(FormData);
    expect(Array.from(form.keys())).toHaveLength(3);
    expect(form.get('val')).toBe('123');
    expect(form.get('nested.arr.0')).toBe('hello');
  });

  it('respects metaTokens option', () => {
    const data = {
      'obj{}': { x: 1, y: 2 },
    };
    const serialized = JSON.stringify(data['obj{}']);

    const form = toFormData(data, null, { metaTokens: false });

    expect(Array.from(form.keys())).toHaveLength(1);
    expect(form.getAll('obj')).toEqual([serialized]);
  });

  describe('flat arrays serialization', () => {
    it('includes full indexes when indexes option is true', () => {
      const data = {
        arr: [1, 2, 3],
        arr2: [1, [2], 3],
      };

      const form = toFormData(data, null, { indexes: true });

      expect(Array.from(form.keys())).toHaveLength(6);
      expect(form.get('arr[0]')).toBe('1');
      expect(form.get('arr[1]')).toBe('2');
      expect(form.get('arr[2]')).toBe('3');
      expect(form.get('arr2[0]')).toBe('1');
      expect(form.get('arr2[1][0]')).toBe('2');
      expect(form.get('arr2[2]')).toBe('3');
    });

    it('includes brackets only when indexes option is false', () => {
      const data = {
        arr: [1, 2, 3],
        arr2: [1, [2], 3],
      };

      const form = toFormData(data, null, { indexes: false });

      expect(Array.from(form.keys())).toHaveLength(6);
      expect(form.getAll('arr[]')).toEqual(['1', '2', '3']);
      expect(form.get('arr2[0]')).toBe('1');
      expect(form.get('arr2[1][0]')).toBe('2');
      expect(form.get('arr2[2]')).toBe('3');
    });

    it('omits brackets when indexes option is null', () => {
      const data = {
        arr: [1, 2, 3],
        arr2: [1, [2], 3],
      };

      const form = toFormData(data, null, { indexes: null });

      expect(Array.from(form.keys())).toHaveLength(6);
      expect(form.getAll('arr')).toEqual(['1', '2', '3']);
      expect(form.get('arr2[0]')).toBe('1');
      expect(form.get('arr2[1][0]')).toBe('2');
      expect(form.get('arr2[2]')).toBe('3');
    });
  });

  it('converts nested data object to FormData', () => {
    const data = {
      val: 123,
      nested: {
        arr: ['hello', 'world'],
      },
    };

    const form = toFormData(data);

    expect(form).toBeInstanceOf(FormData);
    expect(Array.from(form.keys())).toHaveLength(3);
    expect(form.get('val')).toBe('123');
    expect(form.get('nested[arr][0]')).toBe('hello');
  });

  it('appends value whose key ends with [] as separate values with the same key', () => {
    const data = {
      'arr[]': [1, 2, 3],
    };

    const form = toFormData(data);

    expect(Array.from(form.keys())).toHaveLength(3);
    expect(form.getAll('arr[]')).toEqual(['1', '2', '3']);
  });

  it('appends value whose key ends with {} as a JSON string', () => {
    const data = {
      'obj{}': { x: 1, y: 2 },
    };
    const serialized = JSON.stringify(data['obj{}']);

    const form = toFormData(data);

    expect(Array.from(form.keys())).toHaveLength(1);
    expect(form.getAll('obj{}')).toEqual([serialized]);
  });
});
