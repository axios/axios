import { assertEquals } from '@std/assert';
import axios from 'axios';

const env = (fetch: any) => ({
  fetch,
  Request,
  Response,
});

Deno.test('cancel: pre-aborted AbortController cancels request', async () => {
  let fetchCallCount = 0;

  const fetch = async () => {
    fetchCallCount += 1;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const controller = new AbortController();
  controller.abort();

  const err = await axios
    .get('https://example.com/cancel', {
      adapter: 'fetch',
      signal: controller.signal,
      env: env(fetch),
    })
    .catch((e: any) => e);

  assertEquals(axios.isCancel(err), true);
  assertEquals(err.code, 'ERR_CANCELED');
  assertEquals(fetchCallCount, 0);
});

Deno.test('cancel: in-flight abort cancels request', async () => {
  const fetch = (_input: any, init?: any) =>
    new Promise<Response>((_resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new DOMException('The operation was aborted', 'AbortError'));
      }, 20);

      if (init?.signal) {
        if (init.signal.aborted) {
          clearTimeout(timeout);
          reject(new DOMException('The operation was aborted', 'AbortError'));
          return;
        }

        init.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeout);
            reject(new DOMException('The operation was aborted', 'AbortError'));
          },
          { once: true }
        );
      }
    });

  const controller = new AbortController();

  const request = axios.get('https://example.com/in-flight', {
    adapter: 'fetch',
    signal: controller.signal,
    env: env(fetch),
  });

  controller.abort();

  const err = await request.catch((e: any) => e);

  assertEquals(axios.isCancel(err), true);
  assertEquals(err.code, 'ERR_CANCELED');
});

Deno.test('cancel: isCancel returns false for plain Error', () => {
  assertEquals(axios.isCancel(new Error('random')), false);
});
