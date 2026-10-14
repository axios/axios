import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

describe.each(['http', 'fetch'])('Basic auth with the %s adapter', (adapter) => {
  it.runIf(adapter !== 'fetch' || typeof fetch === 'function')(
    'preserves defaults and sends UTF-8 credentials when opted in',
    async () => {
      let requests = 0;
      const server = await startHTTPServer((req, res) => {
        requests++;
        res.end(req.headers.authorization);
      });

      try {
        const url = `http://localhost:${server.address().port}/`;

        for (const enabled of [undefined, false, true]) {
          for (const username of ['naïve', 'π', '😀']) {
            const previousRequests = requests;
            const request = axios.get(url, {
              adapter,
              proxy: false,
              auth: { username, password: 'naïve' },
              transitional: { encodeBasicAuthUsername: enabled },
            });

            // Fetch's legacy config resolution rejects characters above Latin-1,
            // even though its final header encoding (like Node HTTP) is UTF-8.
            if (adapter === 'fetch' && enabled !== true && username !== 'naïve') {
              await assert.rejects(request, { code: 'ERR_BAD_OPTION_VALUE' });
              assert.strictEqual(requests, previousRequests);
            } else {
              const { data } = await request;
              assert.strictEqual(
                data,
                'Basic ' + Buffer.from(`${username}:naïve`, 'utf8').toString('base64')
              );
              assert.strictEqual(requests, previousRequests + 1);
            }
          }
        }
      } finally {
        await stopHTTPServer(server);
      }
    }
  );
});

describe.runIf(typeof fetch === 'function')('Basic auth with custom Fetch', () => {
  it.each([false, true])('supports UTF-8 with Request disabled: %s', async (disableRequest) => {
    let authorization;
    const { data } = await axios.get('https://example.com/', {
      adapter: 'fetch',
      auth: { username: 'π', password: 'x' },
      transitional: { encodeBasicAuthUsername: true },
      env: {
        ...(disableRequest ? { Request: null } : {}),
        fetch: async (input, init) => {
          authorization = new Headers(disableRequest ? init.headers : input.headers).get(
            'Authorization'
          );
          return new Response('ok');
        },
      },
    });

    assert.strictEqual(data, 'ok');
    assert.strictEqual(authorization, 'Basic z4A6eA==');
  });

  it.each(['username', 'password'])('rejects malformed UTF-16 in %s before fetch', async (key) => {
    let called = false;
    await assert.rejects(
      axios.get('https://example.com/', {
        adapter: 'fetch',
        auth: { username: 'user', password: 'x', [key]: '\uD800' },
        transitional: { encodeBasicAuthUsername: true },
        env: {
          fetch: async () => {
            called = true;
            return new Response('unexpected');
          },
        },
      }),
      { code: 'ERR_BAD_OPTION_VALUE', isAxiosError: true }
    );
    assert.strictEqual(called, false);
  });
});
