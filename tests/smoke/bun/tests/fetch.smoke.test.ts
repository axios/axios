import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const createFetchMock = (
  responseFactory?: (input: unknown, init: RequestInit) => Response | Promise<Response>
) => {
  const calls: Array<{ input: unknown; init: RequestInit }> = [];

  const mockFetch = async (input: unknown, init: RequestInit = {}) => {
    calls.push({ input, init });

    if (responseFactory) {
      return responseFactory(input, init);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return {
    mockFetch,
    getCalls: () => calls,
  };
};

const getRequestMeta = async (input: unknown, init: RequestInit = {}) => {
  const request = input instanceof Request ? input : new Request(input as string, init);

  return {
    url: request.url,
    method: request.method,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.clone().text(),
  };
};

const env = (fetch: typeof globalThis.fetch) => ({
  fetch,
  Request,
  Response,
});

describe('fetch adapter', () => {
  test('GET resolves JSON response via fetch adapter', async () => {
    const { mockFetch, getCalls } = createFetchMock();

    const response = await axios.get('https://example.com/users', {
      adapter: 'fetch',
      env: env(mockFetch),
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(getCalls()).toHaveLength(1);
  });

  test('POST serializes JSON body via fetch adapter', async () => {
    const { mockFetch, getCalls } = createFetchMock();

    await axios.post(
      'https://example.com/items',
      { name: 'widget' },
      {
        adapter: 'fetch',
        env: env(mockFetch),
      }
    );

    const { input, init } = getCalls()[0];
    const meta = await getRequestMeta(input, init);
    expect(meta.body).toBe(JSON.stringify({ name: 'widget' }));
  });

  test('HTTP methods are forwarded correctly', async () => {
    const run = async (
      method: 'delete' | 'head' | 'options' | 'put' | 'patch',
      expected: string
    ) => {
      const { mockFetch, getCalls } = createFetchMock();

      if (method === 'put' || method === 'patch') {
        await axios[method](
          'https://example.com/items',
          { name: 'widget' },
          {
            adapter: 'fetch',
            env: env(mockFetch),
          }
        );
      } else {
        await axios[method]('https://example.com/items', {
          adapter: 'fetch',
          env: env(mockFetch),
        });
      }

      const { input, init } = getCalls()[0];
      const meta = await getRequestMeta(input, init);
      expect(meta.method).toBe(expected);
    };

    await run('delete', 'DELETE');
    await run('head', 'HEAD');
    await run('options', 'OPTIONS');
    await run('put', 'PUT');
    await run('patch', 'PATCH');
  });

  test('full URL is preserved in the fetch request', async () => {
    const { mockFetch, getCalls } = createFetchMock();

    await axios.get('https://example.com/users', {
      adapter: 'fetch',
      env: env(mockFetch),
    });

    const { input, init } = getCalls()[0];
    const meta = await getRequestMeta(input, init);

    expect(meta.url).toBe('https://example.com/users');
  });
});
