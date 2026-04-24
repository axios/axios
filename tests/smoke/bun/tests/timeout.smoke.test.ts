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

describe('timeout', () => {
  test('timeout: 50 with never-resolving fetch mock rejects with ECONNABORTED', async () => {
    const fetch = (input: unknown, init?: RequestInit) =>
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

    const err = await axios
      .get('https://example.com/timeout', {
        adapter: 'fetch',
        timeout: 50,
        env: env(fetch),
      })
      .catch((e: any) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ECONNABORTED');
  });
});
