import { describe, expect, test } from 'bun:test';
import axios from 'axios';

const env = (fetch: typeof globalThis.fetch) => ({
  fetch,
  Request,
  Response,
});

describe('progress', () => {
  test('onDownloadProgress fires with loaded > 0 for streaming fetch response', async () => {
    const samples: number[] = [];

    const fetch = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('ab'));
          controller.enqueue(new TextEncoder().encode('cd'));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '4',
        },
      });
    };

    const response = await axios.get('https://example.com/download', {
      adapter: 'fetch',
      responseType: 'text',
      onDownloadProgress: ({ loaded }: { loaded: number }) => {
        samples.push(loaded);
      },
      env: env(fetch),
    });

    expect(response.data).toBe('abcd');
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.some((loaded) => loaded > 0)).toBe(true);
  });
});
