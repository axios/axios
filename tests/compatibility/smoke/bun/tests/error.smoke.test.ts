import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const env = (fetch: typeof globalThis.fetch) => ({
  fetch,
  Request,
  Response,
});

describe('errors', () => {
  test('non-2xx response rejects with AxiosError and status 404', async () => {
    const fetch = async () =>
      new Response(JSON.stringify({ error: 'missing' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      });

    const err = await axios
      .get('https://example.com/missing', {
        adapter: 'fetch',
        env: env(fetch),
      })
      .catch((e: any) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.response.status).toBe(404);
  });

  test('axios.isAxiosError returns false for a plain Error', () => {
    expect(axios.isAxiosError(new Error('plain'))).toBe(false);
  });
});
