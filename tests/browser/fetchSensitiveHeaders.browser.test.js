import { describe, expect, it, vi } from 'vitest';
import axios from '../../index.js';

describe('fetch sensitiveHeaders', () => {
  for (const requestSupported of [true, false]) {
    it(`rejects before calling fetch ${requestSupported ? 'with' : 'without'} Request support`, async () => {
      const customFetch = vi.fn(async () => new Response('ok'));
      const error = await axios
        .get('/sensitive-headers', {
          adapter: 'fetch',
          headers: { 'X-API-Key': 'secret' },
          sensitiveHeaders: ['X-API-Key'],
          env: {
            fetch: customFetch,
            Request: requestSupported ? Request : null,
            Response: requestSupported ? Response : null,
          },
        })
        .catch((error) => error);

      expect(error).toBeInstanceOf(axios.AxiosError);
      expect(error.code).toBe(axios.AxiosError.ERR_NOT_SUPPORT);
      expect(error.message).toMatch(/sensitiveHeaders.*fetch adapter.*http adapter/);
      expect(error.config.sensitiveHeaders).toEqual(['X-API-Key']);
      expect(customFetch).not.toHaveBeenCalled();
    });
  }

  for (const [label, sensitiveHeaders] of [
    ['omitted', undefined],
    ['empty', []],
  ]) {
    it(`preserves requests with ${label} sensitiveHeaders`, async () => {
      const customFetch = vi.fn(async () => new Response('ok'));
      const { data } = await axios.get('/sensitive-headers', {
        adapter: 'fetch',
        headers: { 'X-API-Key': 'secret' },
        sensitiveHeaders,
        env: { fetch: customFetch },
      });

      expect(data).toBe('ok');
      expect(customFetch).toHaveBeenCalledOnce();
      expect(customFetch.mock.calls[0][0].headers.get('X-API-Key')).toBe('secret');
    });
  }
});
