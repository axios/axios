import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from '../../index.js';

describe('fetch response duration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([200, 500])('includes body buffering for status %s', async (status) => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const result = await axios
      .get(new URL('/timing', location.href).href, {
        adapter: 'fetch',
        env: {
          fetch: async () => {
            now += 10;
            return new Response(
              new ReadableStream({
                pull(controller) {
                  now += 15;
                  controller.enqueue(new TextEncoder().encode('{"ok":true}'));
                  controller.close();
                },
              }),
              { status }
            );
          },
        },
      })
      .catch((error) => error);

    expect(axios.isAxiosError(result)).toBe(status === 500);
    const response = status === 500 ? result.response : result;
    expect(response.duration).toBe(25);
    expect(response.data).toEqual({ ok: true });
  });

  it('excludes later stream consumption', async () => {
    let now = 1000;
    let controller;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const response = await axios.get(new URL('/timing', location.href).href, {
      adapter: 'fetch',
      responseType: 'stream',
      env: {
        fetch: async () => {
          now += 25;
          return new Response(
            new ReadableStream({
              start(streamController) {
                controller = streamController;
              },
            })
          );
        },
      },
    });

    try {
      expect(response.duration).toBe(25);
      now += 75;
      controller.enqueue(new TextEncoder().encode('body'));
      controller.close();
      expect(await new Response(response.data).text()).toBe('body');
      expect(response.duration).toBe(25);
    } finally {
      if (!response.data.locked) await response.data.cancel();
    }
  });
});
