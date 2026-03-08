import { describe, it, expect } from 'vitest';
import transformData from '../../../lib/core/transformData.js';

describe('core::transformData', () => {
  it('supports a single transformer', () => {
    const data = transformData.call({}, (value) => {
      value = 'foo';
      return value;
    });

    expect(data).toBe('foo');
  });

  it('supports an array of transformers', () => {
    const data = transformData.call({ data: '' }, [
      (value) => value + 'f',
      (value) => value + 'o',
      (value) => value + 'o',
    ]);

    expect(data).toBe('foo');
  });

  it('passes headers through to transformers', () => {
    const headers = {
      'content-type': 'foo/bar',
    };

    const data = transformData.call(
      {
        data: '',
        headers,
      },
      [(value, currentHeaders) => value + currentHeaders['content-type']]
    );

    expect(data).toBe('foo/bar');
  });

  it('passes status code through to transformers', () => {
    const data = transformData.call(
      {},
      [(value, _headers, status) => value + status],
      { data: '', status: 200 }
    );

    expect(data).toBe('200');
  });
});
