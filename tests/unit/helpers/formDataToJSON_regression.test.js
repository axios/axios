import { describe, it, expect } from 'vitest';
import formDataToJSON from '../../../lib/helpers/formDataToJSON.js';

describe('formDataToJSON regression (#11295)', () => {
  it('should handle nested fields named "length" without throwing RangeError', () => {
    const formData = new FormData();
    formData.append('metadata[length]', 'long');
    expect(formDataToJSON(formData)).toEqual({
      metadata: { length: 'long' },
    });
  });

  it('should handle mixed numeric and "length" keys in the same object', () => {
    const formData = new FormData();
    formData.append('tags[0]', 'rust');
    formData.append('tags[1]', 'go');
    formData.append('tags[length]', 'custom-length');
    
    // It should treat it as an object because of the non-numeric 'length' key
    expect(formDataToJSON(formData)).toEqual({
      tags: {
        0: 'rust',
        1: 'go',
        length: 'custom-length',
      },
    });
  });

  it('should handle deeply nested "length" keys', () => {
    const formData = new FormData();
    formData.append('a[b][length]', 'val');
    expect(formDataToJSON(formData)).toEqual({
      a: {
        b: { length: 'val' },
      },
    });
  });
});

  it('should handle arrays of objects where each object has a "length" key', () => {
    const formData = new FormData();
    formData.append('a[0][length]', '1');
    formData.append('a[1][length]', '2');
    expect(formDataToJSON(formData)).toEqual({
      a: [
        { length: '1' },
        { length: '2' },
      ],
    });
  });

  it('should handle a "length" key that itself contains an array', () => {
    const formData = new FormData();
    formData.append('a[length][0]', 'val');
    expect(formDataToJSON(formData)).toEqual({
      a: {
        length: ['val'],
      },
    });
  });
