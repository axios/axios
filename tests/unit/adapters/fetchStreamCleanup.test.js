import { describe, it, expect, vi } from 'vitest';
import { getEventListeners } from 'node:events';
import axios from '../../../index.js';

describe('fetch adapter stream cleanup', () => {
  for (const RequestClass of [Request, null]) {
    it(`cancels an oversized upload with ${RequestClass ? 'native' : 'no'} Request`, async () => {
      const cancel = vi.fn();
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(16));
        },
        cancel,
      });

      await expect(
        axios.post('http://localhost/upload', source, {
          adapter: 'fetch',
          maxBodyLength: 8,
          env: {
            Request: RequestClass,
            async fetch(input, init) {
              const body = RequestClass ? input.body : init.body;
              await new Response(body).arrayBuffer();
              return new Response('ok');
            },
          },
        })
      ).rejects.toMatchObject({ code: 'ERR_BAD_REQUEST' });
      await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    });
  }

  for (const responseType of ['text', 'stream']) {
    it(`cancels an oversized ${responseType} download`, async () => {
      const cancel = vi.fn();
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(16));
        },
        cancel,
      });
      const request = axios.get('http://localhost/download', {
        adapter: 'fetch',
        maxContentLength: 8,
        responseType,
        env: { fetch: async () => new Response(source) },
      });
      const consume = async () => {
        const response = await request;
        if (responseType === 'stream') {
          await new Response(response.data).arrayBuffer();
        }
      };
      await expect(consume()).rejects.toMatchObject({ code: 'ERR_BAD_RESPONSE' });
      await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    });
  }

  it('removes the abort listener of a stream response without a body', async () => {
    const controller = new AbortController();
    const response = await axios.get('http://localhost/no-content', {
      adapter: 'fetch',
      responseType: 'stream',
      signal: controller.signal,
      env: { fetch: async () => new Response(null, { status: 204 }) },
    });

    expect(response.data).toBeNull();
    await vi.waitFor(() => expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0));
  });

  it('clears the timeout of a stream response without a body', async () => {
    let fetchSignal;
    await axios.get('http://localhost/no-content', {
      adapter: 'fetch',
      responseType: 'stream',
      timeout: 20,
      env: {
        async fetch(input) {
          fetchSignal = input.signal;
          return new Response(null, { status: 204 });
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchSignal.aborted).toBe(false);
  });
});
