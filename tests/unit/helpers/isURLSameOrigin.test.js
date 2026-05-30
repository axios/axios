import { describe, it } from 'vitest';
import assert from 'assert';

describe('helpers::isURLSameOrigin', () => {
  it('returns false if origin cannot be parsed', async () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    let isURLSameOrigin;

    try {
      globalThis.window = {
        location: {
          href: 'https://[::1',
        },
      };
      globalThis.document = {};

      ({ default: isURLSameOrigin } = await import('../../../lib/helpers/isURLSameOrigin.js'));

      assert.strictEqual(isURLSameOrigin('/relative/path'), false);
      assert.strictEqual(isURLSameOrigin('https://example.com/'), false);
    } finally {
      if (originalWindow === undefined) {
        delete globalThis.window;
      } else {
        globalThis.window = originalWindow;
      }

      if (originalDocument === undefined) {
        delete globalThis.document;
      } else {
        globalThis.document = originalDocument;
      }
    }
  });
});
