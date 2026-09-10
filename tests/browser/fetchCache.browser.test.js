import { describe, expect, it } from 'vitest';
import axios from '../../index.js';

describe('fetch cache compatibility', () => {
  [undefined, 'no-store', 'no-cache'].forEach((cache) => {
    it(`preserves ${cache || 'the native default'} cache behavior`, async () => {
      let captured;
      const response = await axios.get('/cache', {
        adapter: 'fetch',
        fetchOptions: cache === undefined ? undefined : { cache },
        env: {
          fetch(input) {
            captured = input;
            return Promise.resolve(new Response('ok'));
          },
        },
      });

      expect(response.data).toBe('ok');
      expect(captured.cache).toBe(cache || 'default');
    });
  });

  it('omits cache when the Request implementation rejects every explicit mode', async () => {
    let capturedInit;

    class CacheDisabledRequest extends Request {
      constructor(input, init) {
        if (init && init.cache !== undefined) {
          throw new TypeError("The 'cache' field on 'RequestInitializerDict' is not implemented.");
        }

        super(input, init);
        capturedInit = init;
      }
    }

    const response = await axios.get('/cache-disabled', {
      adapter: 'fetch',
      env: {
        Request: CacheDisabledRequest,
        fetch() {
          return Promise.resolve(new Response('ok'));
        },
      },
    });

    expect(response.data).toBe('ok');
    expect(Object.prototype.hasOwnProperty.call(capturedInit, 'cache')).toBe(false);
    expect(capturedInit.redirect).toBe('follow');
  });
});
