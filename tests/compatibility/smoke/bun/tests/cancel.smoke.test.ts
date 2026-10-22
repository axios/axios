import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const env = (fetch: typeof globalThis.fetch) => ({
  fetch,
  Request,
  Response,
});

describe('cancellation', () => {
  test('pre-aborted AbortController cancels before fetch is called', async () => {
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

    expect(axios.isCancel(err)).toBe(true);
    expect(err.code).toBe('ERR_CANCELED');
    expect(fetchCallCount).toBe(0);
  });

  test('in-flight AbortController abort cancels the request', async () => {
    const fetch = (_input: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const abortError = () =>
          reject(new DOMException('The operation was aborted', 'AbortError'));

        const timeout = setTimeout(abortError, 20);

        if (init?.signal) {
          if (init.signal.aborted) {
            clearTimeout(timeout);
            abortError();
            return;
          }

          init.signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timeout);
              abortError();
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

    expect(axios.isCancel(err)).toBe(true);
    expect(err.code).toBe('ERR_CANCELED');
  });

  test('axios.isCancel returns false for a plain Error', () => {
    expect(axios.isCancel(new Error('random'))).toBe(false);
  });
});
