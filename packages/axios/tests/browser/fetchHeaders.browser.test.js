import { describe, expect, it } from 'vitest';
import axios, { AxiosHeaders } from '../../index.js';

describe('fetch response headers', () => {
  it('preserves a header named __proto__ from native Response headers', async () => {
    const { data, headers } = await axios.get('/response-headers', {
      adapter: 'fetch',
      env: {
        async fetch() {
          return new Response('ok', {
            headers: [
              ['__proto__', 'server-value'],
              ['x-other', 'other-value'],
            ],
          });
        },
      },
    });

    expect(data).toBe('ok');
    expect(Object.getPrototypeOf(headers)).toBe(AxiosHeaders.prototype);
    expect(headers.get('__proto__')).toBe('server-value');
    expect(headers.get('__PROTO__')).toBe('server-value');
    expect(headers.get('x-other')).toBe('other-value');
    expect(headers.toJSON().__Proto__).toBe('server-value');
  });
});
