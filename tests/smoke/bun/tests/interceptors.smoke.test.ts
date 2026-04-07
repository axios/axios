import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const createFetchCapture = () => {
  const calls: Request[] = [];

  const fetch = async (input: unknown, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input as string, init);
    calls.push(request);

    return new Response(JSON.stringify({ value: 'ok' }), {
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

describe('interceptors', () => {
  test('request interceptor header is forwarded to fetch', async () => {
    const { fetch, getCalls } = createFetchCapture();
    const client = axios.create({
      adapter: 'fetch',
      env: env(fetch),
    });

    client.interceptors.request.use((config: any) => {
      config.headers = config.headers || {};
      config.headers['X-Added'] = 'yes';
      return config;
    });

    await client.get('https://example.com/interceptor-request');

    expect(getCalls()).toHaveLength(1);
    expect(getCalls()[0].headers.get('x-added')).toBe('yes');
  });

  test('response interceptor transform is reflected in resolved value', async () => {
    const { fetch } = createFetchCapture();
    const client = axios.create({
      adapter: 'fetch',
      env: env(fetch),
    });

    client.interceptors.response.use((response: any) => {
      response.data.value = String(response.data.value).toUpperCase();
      return response;
    });

    const response = await client.get('https://example.com/interceptor-response');

    expect(response.data).toEqual({ value: 'OK' });
  });
});
