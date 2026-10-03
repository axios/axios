import { describe, it } from 'vitest';
import assert from 'assert';
import http from 'http';
import axios from '../../../index.js';

describe.runIf(typeof fetch === 'function')('fetch request header preservation', () => {
  for (const fetchOptions of [{}, { cache: 'no-store' }, { redirect: 'follow' }]) {
    for (const polluted of [false, true]) {
      it(`preserves resolved headers with ${JSON.stringify(fetchOptions)} and pollution=${polluted}`, async () => {
        const server = http.createServer((req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(req.headers));
        });
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, 'headers');
        try {
          if (polluted) {
            Object.defineProperty(Object.prototype, 'headers', {
              value: { Authorization: 'Bearer inherited-test-value' },
              configurable: true,
              writable: true,
            });
          }
          const { data } = await axios.get(`http://127.0.0.1:${server.address().port}/`, {
            adapter: 'fetch',
            headers: { 'X-Ordinary': 'yes' },
            fetchOptions: Object.freeze({ ...fetchOptions }),
            timeout: 2000,
          });
          assert.strictEqual(data['x-ordinary'], 'yes');
          assert.strictEqual(data.authorization, undefined);
        } finally {
          if (descriptor) {
            Object.defineProperty(Object.prototype, 'headers', descriptor);
          } else {
            delete Object.prototype.headers;
          }
          server.closeAllConnections();
          await new Promise((resolve) => server.close(resolve));
        }
      });
    }
  }
});
