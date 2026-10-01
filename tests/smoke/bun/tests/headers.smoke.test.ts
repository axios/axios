import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const createFetchCapture = () => {
  const calls: Request[] = [];

  const fetch = async (input: unknown, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input as string, init);
    calls.push(request);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return {
    fetch,
    getCalls: () => calls,
  };
};

const env = (fetch: typeof globalThis.fetch) => ({
  fetch,
  Request,
  Response,
});

describe('headers', () => {
  test('custom X-Custom header is forwarded to mock fetch (case-insensitive)', async () => {
    const { fetch, getCalls } = createFetchCapture();

    await axios.get('https://example.com/custom-headers', {
      adapter: 'fetch',
      headers: {
        'X-Custom': 'trace-123',
      },
      env: env(fetch),
    });

    const request = getCalls()[0];
    expect(request.headers.get('x-custom')).toBe('trace-123');
  });

  test('content-type application/json is inferred for JSON POST body', async () => {
    const { fetch, getCalls } = createFetchCapture();

    await axios.post(
      'https://example.com/post-json',
      { name: 'widget' },
      {
        adapter: 'fetch',
        env: env(fetch),
      }
    );

    const request = getCalls()[0];
    const contentType = request.headers.get('content-type') || '';

    expect(contentType.includes('application/json')).toBe(true);
  });
});
