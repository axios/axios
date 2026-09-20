import { describe, it, expect, vi } from 'vitest';
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
});
