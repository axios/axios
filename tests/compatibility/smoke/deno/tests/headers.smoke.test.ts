import { assertEquals } from '@std/assert';
import axios from 'axios';

const createFetchCapture = () => {
  const calls: Request[] = [];

  const fetch = async (input: any, init?: any) => {
    const request = input instanceof Request ? input : new Request(input, init);
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

const env = (fetch: any) => ({
  fetch,
  Request,
  Response,
});

Deno.test('headers: default Accept header is sent', async () => {
  const { fetch, getCalls } = createFetchCapture();

  await axios.get('https://example.com/default-headers', {
    adapter: 'fetch',
    env: env(fetch),
  });

  const request = getCalls()[0];
  assertEquals(request.headers.get('accept'), 'application/json, text/plain, */*');
});

Deno.test('headers: custom headers are forwarded', async () => {
  const { fetch, getCalls } = createFetchCapture();

  await axios.get('https://example.com/custom-headers', {
    adapter: 'fetch',
    headers: {
      'X-Trace-Id': 'trace-123',
      Authorization: 'Bearer token-abc',
    },
    env: env(fetch),
  });

  const request = getCalls()[0];
  assertEquals(request.headers.get('x-trace-id'), 'trace-123');
  assertEquals(request.headers.get('authorization'), 'Bearer token-abc');
});

Deno.test('headers: content-type is set for JSON POST payload', async () => {
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
  assertEquals(contentType.includes('application/json'), true);
});

Deno.test('headers: content-type is absent for bodyless GET', async () => {
  const { fetch, getCalls } = createFetchCapture();

  await axios.get('https://example.com/get-no-body', {
    adapter: 'fetch',
    env: env(fetch),
  });

  const request = getCalls()[0];
  assertEquals(request.headers.get('content-type'), null);
});
