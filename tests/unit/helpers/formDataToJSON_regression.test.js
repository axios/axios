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
