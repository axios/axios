import { describe, it } from 'vitest';
import assert from 'assert';
import getStream from 'get-stream';
import axios from '../../../index.js';
import { setTimeoutAsync, startHTTPServer, stopHTTPServer } from '../../setup/server.js';

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

describe('HTTP/2 closeHttp2Sessions', () => {
  it('drains an in-flight response and then closes the pooled session', async () => {
    let releaseHeld;
    const holdResponse = new Promise((resolve) => (releaseHeld = resolve));
    const server = await startHTTPServer(
      (req, res) => {
        if (req.url === '/held') {
          // Flush the headers now; only the body is held back.
          res.write('held-');
          holdResponse.then(() => res.end('held-body'));
        } else {
          res.end('fresh-body');
        }
      },
      { useHTTP2: true }
    );

    let connections = 0;
    server.on('session', () => {
      connections++;
    });

    const clientSessions = new Set();

    try {
      const client = axios.create({
        baseURL: `https://localhost:${server.address().port}`,
        httpVersion: 2,
        proxy: false,
        responseType: 'stream',
        http2Options: { rejectUnauthorized: false },
      });

      const held = await client.get('/held');
      const pooledSession = held.data.session;
      clientSessions.add(pooledSession);

      let sessionClosed = false;
      pooledSession.once('close', () => {
        sessionClosed = true;
      });

      let drained = false;
      const shutdown = client.closeHttp2Sessions().then(() => {
        drained = true;
      });

      // The pool evicts at once, but the session survives until the in-flight
      // response completes, so the shutdown promise must not resolve yet.
      await setTimeoutAsync(50);
      assert.strictEqual(drained, false);
      assert.strictEqual(sessionClosed, false);

      releaseHeld();

      assert.strictEqual(await getStream(held.data), 'held-held-body');

      await shutdown;

      assert.strictEqual(sessionClosed, true);

      // Later requests open a fresh session.
      const fresh = await client.get('/fresh');
      const freshSession = fresh.data.session;
      clientSessions.add(freshSession);
      assert.notStrictEqual(freshSession, pooledSession);
      assert.strictEqual(await getStream(fresh.data), 'fresh-body');
      assert.strictEqual(connections, 2);
    } finally {
      for (const session of clientSessions) {
        session.destroy();
      }
      await stopHTTPServer(server);
    }
  });
});
