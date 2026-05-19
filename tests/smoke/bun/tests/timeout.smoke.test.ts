import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const env = (fetch: typeof globalThis.fetch) => ({
  fetch,
  Request,
  Response,
});

const createAbortedError = () => {
  const error = new Error('The operation was aborted') as Error & { code?: string; name: string };
  error.name = 'AbortError';
  error.code = 'ECONNABORTED';
  return error;
};

// A fetch mock that never resolves and only rejects when the request is
// aborted, so the only thing that ends the request is axios' own timeout.
const neverResolvingFetch =
  () =>
  (input: unknown, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal || (input instanceof Request ? input.signal : undefined);

      if (signal) {
        if (signal.aborted) {
          reject(createAbortedError());
          return;
        }

        signal.addEventListener(
          'abort',
          () => {
            reject(createAbortedError());
          },
          { once: true }
        );
      }
    });

describe('timeout', () => {
  test('timeout via fetch adapter rejects with ECONNABORTED by default', async () => {
    const err = await axios
      .get('https://example.com/timeout', {
        adapter: 'fetch',
        timeout: 50,
        env: env(neverResolvingFetch()),
      })
      .catch((e: any) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    // Parity with the xhr/http adapters (issue #10888): the default timeout
    // code is ECONNABORTED, not ETIMEDOUT.
    expect(err.code).toBe('ECONNABORTED');
  });

  test('timeout via fetch adapter rejects with ETIMEDOUT when clarifyTimeoutError is set', async () => {
    const err = await axios
      .get('https://example.com/timeout', {
        adapter: 'fetch',
        timeout: 50,
        transitional: { clarifyTimeoutError: true },
        env: env(neverResolvingFetch()),
      })
      .catch((e: any) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ETIMEDOUT');
  });
});