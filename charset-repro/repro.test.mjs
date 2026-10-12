import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import axios from 'axios';

const latin1Bytes = Buffer.from([0x49, 0x6d, 0xe1, 0x67, 0x65, 0x6e, 0x65, 0x73]); // Imágenes
const utf8Bytes = Buffer.from('Imágenes', 'utf8');
const eucJpBytes = Buffer.from([0xc6, 0xfc, 0xcb, 0xdc, 0xb8, 0xec]); // 日本語 (EUC-JP)

let server;
let baseUrl;

before(async () => {
  server = createServer((req, res) => {
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

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('UTF-8 response decodes correctly by default', async () => {
  const response = await axios.get(`${baseUrl}/utf8`);
  assert.equal(response.data, 'Imágenes');
});

test('declared ISO-8859-1 is not automatically honored by the default response decoder', async () => {
  const response = await axios.get(`${baseUrl}/latin1`);
  assert.equal(response.headers['content-type'], 'text/plain; charset=ISO-8859-1');
  assert.notEqual(response.data, 'Imágenes');
  assert.match(response.data, /�/);
});

test('responseEncoding latin1 is a manual workaround for ISO-8859-1', async () => {
  const response = await axios.get(`${baseUrl}/latin1`, { responseEncoding: 'latin1' });
  assert.equal(response.data, 'Imágenes');
});

test('EUC-JP bytes are not decoded correctly by the default UTF-8 decoder', async () => {
  const response = await axios.get(`${baseUrl}/euc-jp`);
  assert.equal(response.headers['content-type'], 'text/plain; charset=EUC-JP');
  assert.notEqual(response.data, '日本語');
  assert.match(response.data, /�/);
});

test('Node Buffer responseEncoding does not support the EUC-JP label', async () => {
  await assert.rejects(
    axios.get(`${baseUrl}/euc-jp`, { responseEncoding: 'euc-jp' }),
    (error) => error?.code === 'ERR_UNKNOWN_ENCODING'
  );
});
