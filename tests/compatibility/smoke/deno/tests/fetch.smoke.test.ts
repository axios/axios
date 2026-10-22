import { assertEquals } from '@std/assert';
import axios from 'axios';

const createFetchMock = (
  responseFactory?: (input: any, init: any) => Response | Promise<Response>
) => {
  const calls: Array<{ input: any; init: any }> = [];

  const mockFetch = async (input: any, init: any = {}) => {
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

const getRequestMeta = async (input: any, init: any) => {
  const request = input instanceof Request ? input : new Request(input, init);

  return {
    url: request.url,
    method: request.method,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.clone().text(),
  };
};

const env = (fetch: any) => ({
  fetch,
  Request,
  Response,
});

Deno.test('fetch adapter: GET resolves JSON response', async () => {
  const { mockFetch, getCalls } = createFetchMock();

  const response = await axios.get('https://example.com/users', {
    adapter: 'fetch',
    env: env(mockFetch),
  });

  assertEquals(response.status, 200);
  assertEquals(response.data, { ok: true });
  assertEquals(getCalls().length, 1);
});

Deno.test('fetch adapter: forwards HTTP methods', async () => {
  const run = async (
    method: 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch',
    expected: string
  ) => {
    const { mockFetch, getCalls } = createFetchMock();

    if (method === 'post' || method === 'put' || method === 'patch') {
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
    assertEquals(meta.method, expected);
  };

  await run('delete', 'DELETE');
  await run('head', 'HEAD');
  await run('options', 'OPTIONS');
  await run('post', 'POST');
  await run('put', 'PUT');
  await run('patch', 'PATCH');
});

Deno.test('fetch adapter: serializes JSON body for POST', async () => {
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

  assertEquals(meta.body, JSON.stringify({ name: 'widget' }));
});

Deno.test('fetch adapter: forwards full URL', async () => {
  const { mockFetch, getCalls } = createFetchMock();

  await axios.get('https://example.com/users', {
    adapter: 'fetch',
    env: env(mockFetch),
  });

  const { input, init } = getCalls()[0];
  const meta = await getRequestMeta(input, init);

  assertEquals(meta.url, 'https://example.com/users');
});
