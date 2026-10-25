import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

for (const adapter of ['http', 'fetch']) {
  describe.skipIf(adapter === 'fetch' && typeof fetch !== 'function')(
    `${adapter} cancellation request isolation`,
    () => {
      for (const kind of ['signal', 'cancelToken', 'both']) {
        it(`does not send a request canceled in an async interceptor (${kind})`, async () => {
          let hits = 0;
          const server = await startHTTPServer((req, res) => {
            hits++;
            res.end('OK');
          });
          const instance = axios.create({ adapter, proxy: false });
          const controller = new AbortController();
          const source = axios.CancelToken.source();
          instance.interceptors.request.use(async (config) => {
            await Promise.resolve();
            if (kind !== 'cancelToken') controller.abort();
            if (kind !== 'signal') source.cancel('canceled');
            return config;
          });

          try {
            await assert.rejects(
              instance.get(`http://127.0.0.1:${server.address().port}/`, {
                ...(kind !== 'cancelToken' ? { signal: controller.signal } : {}),
                ...(kind !== 'signal' ? { cancelToken: source.token } : {}),
              }),
              (error) => error.code === 'ERR_CANCELED' && axios.isCancel(error)
            );
            assert.strictEqual(hits, 0);
          } finally {
            await stopHTTPServer(server);
          }
        });

        it(`allows another request after an in-flight cancellation (${kind})`, async () => {
          let received;
          const firstReceived = new Promise((resolve) => {
            received = resolve;
          });
          const server = await startHTTPServer((req, res) => {
            if (req.url === '/cancel') {
              received();
              return;
            }
            res.end('OK');
          });
          const instance = axios.create({ adapter, proxy: false, timeout: 2000 });
          const controller = new AbortController();
          const source = axios.CancelToken.source();
          const baseURL = `http://127.0.0.1:${server.address().port}`;

          try {
            const pending = instance
              .get(`${baseURL}/cancel`, {
                ...(kind !== 'cancelToken' ? { signal: controller.signal } : {}),
                ...(kind !== 'signal' ? { cancelToken: source.token } : {}),
              })
              .catch((error) => error);

            await Promise.race([
              firstReceived,
              pending.then((error) => {
                throw error;
              }),
            ]);
            if (kind !== 'cancelToken') controller.abort();
            if (kind !== 'signal') source.cancel('canceled');
            const error = await pending;
            assert.strictEqual(error.code, 'ERR_CANCELED');
            assert.ok(axios.isCancel(error));

            const response = await instance.get(`${baseURL}/next`, {
              signal: new AbortController().signal,
            });
            assert.strictEqual(response.data, 'OK');
          } finally {
            await stopHTTPServer(server);
          }
        });
      }
    }
  );
}
