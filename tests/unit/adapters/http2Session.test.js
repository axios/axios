import { describe, it } from 'vitest';
import assert from 'assert';
import getStream from 'get-stream';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

describe('HTTP/2 GOAWAY session handling', () => {
  it('opens a new connection inside the GOAWAY callback while the old response drains', async () => {
    let firstResponse;
    let serverSession;
    let connections = 0;
    const clientSessions = new Set();
    const server = await startHTTPServer(
      (req, res) => {
        if (req.url === '/first') {
          firstResponse = res;
          serverSession = req.stream.session;
          res.write('start-');
        } else {
          res.end('next');
        }
      },
      { useHTTP2: true }
    );
    server.on('session', () => {
      connections++;
    });

    try {
      const client = axios.create({
        baseURL: `https://localhost:${server.address().port}`,
        httpVersion: 2,
        proxy: false,
        responseType: 'stream',
        http2Options: { rejectUnauthorized: false },
      });
      const first = await client.get('/first');
      const firstSession = first.data.session;
      clientSessions.add(firstSession);

      const nextResponse = new Promise((resolve, reject) => {
        firstSession.once('goaway', () => {
          // Request synchronously, before Node finishes processing GOAWAY.
          client.get('/next').then(resolve, reject);
        });
      });
      serverSession.goaway();
      const second = await nextResponse;
      clientSessions.add(second.data.session);

      assert.notStrictEqual(second.data.session, firstSession);
      assert.strictEqual(connections, 2);
      assert.strictEqual(await getStream(second.data), 'next');

      firstResponse.end('end');
      assert.strictEqual(await getStream(first.data), 'start-end');
    } finally {
      for (const session of clientSessions) {
        session.destroy();
      }
      await stopHTTPServer(server);
    }
  });
});
