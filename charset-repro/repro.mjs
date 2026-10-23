import axios from '../index.js';
import { startHTTPServer, stopHTTPServer } from '../tests/setup/server.js';

const client = axios.create({ proxy: false });
const responses = {
  '/latin1': {
    type: 'text/plain; charset=ISO-8859-1',
    body: Buffer.from([0x49, 0x6d, 0xe1, 0x67, 0x65, 0x6e, 0x65, 0x73]),
    expected: 'Imágenes'
  },
  '/utf8': {
    type: 'text/plain; charset=utf-8',
    body: Buffer.from('Imágenes', 'utf8'),
    expected: 'Imágenes'
  },
  '/euc-jp': {
    type: 'text/plain; charset=EUC-JP',
    body: Buffer.from([0xc6, 0xfc, 0xcb, 0xdc, 0xb8, 0xec]),
    expected: '日本語'
  }
};

let server;

try {
  server = await startHTTPServer((req, res) => {
    const item = responses[req.url];
    if (!item) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': item.type });
    res.end(item.body);
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  for (const [path, item] of Object.entries(responses)) {
    const response = await client.get(`${baseUrl}${path}`);
    console.log(`\nGET ${path}`);
    console.log(`  Content-Type: ${response.headers['content-type']}`);
    console.log(`  Expected:     ${item.expected}`);
    console.log(`  Actual:       ${response.data}`);
    console.log(`  Match:        ${response.data === item.expected}`);
  }

  const manual = await client.get(`${baseUrl}/latin1`, { responseEncoding: 'latin1' });
  console.log('\nISO-8859-1 with responseEncoding: latin1');
  console.log(`  Actual:       ${manual.data}`);
  console.log(`  Match:        ${manual.data === responses['/latin1'].expected}`);

  try {
    await client.get(`${baseUrl}/euc-jp`, { responseEncoding: 'euc-jp' });
  } catch (error) {
    console.log('\nEUC-JP with responseEncoding: euc-jp');
    console.log(`  Error:        ${error.code ?? error.message}`);
  }
} finally {
  await stopHTTPServer(server);
}
