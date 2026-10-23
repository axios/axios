import { describe, it } from 'vitest';
import assert from 'assert';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';
import axios from '../../../index.js';

describe('response decoding for non-UTF-8 charsets (issue #5317)', () => {
  const latin1Bytes = Buffer.from([0x49, 0x6d, 0xe1, 0x67, 0x65, 0x6e, 0x65, 0x73]); // Imágenes
  const utf8Bytes = Buffer.from('Imágenes', 'utf8');
  const eucJpBytes = Buffer.from([0xc6, 0xfc, 0xcb, 0xdc, 0xb8, 0xec]); // 日本語 (EUC-JP)

  const getServerAndUrl = async () => {
    const server = await startHTTPServer((req, res) => {
      if (req.url === '/latin1') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=ISO-8859-1' });
        res.end(latin1Bytes);
        return;
      }

      if (req.url === '/utf8') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(utf8Bytes);
        return;
      }

      if (req.url === '/euc-jp') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=EUC-JP' });
        res.end(eucJpBytes);
        return;
      }

      res.writeHead(404);
      res.end('not found');
    });

    return { server, url: `http://127.0.0.1:${server.address().port}` };
  };

  it('should decode a UTF-8 response correctly by default', async () => {
    const { server, url } = await getServerAndUrl();

    try {
      const response = await axios.get(`${url}/utf8`, { proxy: false });
      assert.strictEqual(response.data, 'Imágenes');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should not honor the declared ISO-8859-1 charset by default', async () => {
    const { server, url } = await getServerAndUrl();

    try {
      const response = await axios.get(`${url}/latin1`, { proxy: false });
      assert.strictEqual(response.headers['content-type'], 'text/plain; charset=ISO-8859-1');
      assert.notStrictEqual(response.data, 'Imágenes');
      assert.match(response.data, /\uFFFD/);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should decode an ISO-8859-1 response with the Node-only responseEncoding: latin1 option', async () => {
    const { server, url } = await getServerAndUrl();

    try {
      const response = await axios.get(`${url}/latin1`, { proxy: false, responseEncoding: 'latin1' });
      assert.strictEqual(response.data, 'Imágenes');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should not decode EUC-JP bytes correctly with the default UTF-8 decoder', async () => {
    const { server, url } = await getServerAndUrl();

    try {
      const response = await axios.get(`${url}/euc-jp`, { proxy: false });
      assert.strictEqual(response.headers['content-type'], 'text/plain; charset=EUC-JP');
      assert.notStrictEqual(response.data, '日本語');
      assert.match(response.data, /\uFFFD/);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should reject responseEncoding euc-jp because Node Buffer.toString() does not support it', async () => {
    const { server, url } = await getServerAndUrl();

    try {
      await assert.rejects(
        axios.get(`${url}/euc-jp`, { proxy: false, responseEncoding: 'euc-jp' }),
        (error) => error?.code === 'ERR_UNKNOWN_ENCODING'
      );
    } finally {
      await stopHTTPServer(server);
    }
  });
});
