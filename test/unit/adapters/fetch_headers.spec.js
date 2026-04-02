import assert from 'assert';
import http from 'http';
import axios from '../../../index.js';

// Spin up a minimal local echo server so tests are deterministic and offline.
// It echoes back the received request headers as JSON: { headers: { ... } }
let server;
let baseURL;

before(function (done) {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ headers: req.headers, body }));
    });
  });
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    baseURL = `http://127.0.0.1:${port}`;
    done();
  });
});

after(function (done) {
  server.close(done);
});

describe('fetch adapter headers', function () {
  this.timeout(5000);

  it('should include User-Agent header', async function () {
    const response = await axios.post(`${baseURL}/post`, 'test', {
      adapter: 'fetch',
      headers: { 'Content-Type': 'text/plain' }
    });

    assert.ok(response.data.headers['user-agent']);
    // Use axios.VERSION so this test survives version bumps
    assert.strictEqual(response.data.headers['user-agent'], 'axios/' + axios.VERSION);
  });

  it('should include Content-Length header', async function () {
    // Use a multibyte string to catch byte-length vs char-length regressions
    const testData = 'héllo wörld';
    const response = await axios.post(`${baseURL}/post`, testData, {
      adapter: 'fetch',
      headers: { 'Content-Type': 'text/plain' }
    });

    assert.ok(response.data.headers['content-length']);
    // Must use Buffer.byteLength, not string .length, for multibyte correctness
    assert.strictEqual(
      response.data.headers['content-length'],
      Buffer.byteLength(testData).toString()
    );
  });

  it('should include Accept-Encoding header', async function () {
    const response = await axios.get(`${baseURL}/get`, {
      adapter: 'fetch'
    });

    assert.ok(response.data.headers['accept-encoding']);
    assert.ok(response.data.headers['accept-encoding'].includes('gzip'));
    assert.ok(response.data.headers['accept-encoding'].includes('deflate'));
    assert.ok(response.data.headers['accept-encoding'].includes('br'));
  });

  it('should include Host header', async function () {
    const response = await axios.get(`${baseURL}/get`, {
      adapter: 'fetch'
    });

    assert.ok(response.data.headers['host']);
    assert.ok(response.data.headers['host'].startsWith('127.0.0.1'));
  });

  it('should not override user-provided headers', async function () {
    const customUserAgent = 'Custom-Agent/1.0';
    const response = await axios.get(`${baseURL}/get`, {
      adapter: 'fetch',
      headers: { 'User-Agent': customUserAgent }
    });

    assert.strictEqual(response.data.headers['user-agent'], customUserAgent);
  });

  it('should handle different data types for Content-Length', async function () {
    const testData = JSON.stringify({ key: 'value' });
    const response = await axios.post(`${baseURL}/post`, testData, {
      adapter: 'fetch',
      headers: { 'Content-Type': 'application/json' }
    });

    assert.ok(response.data.headers['content-length']);
    assert.strictEqual(
      response.data.headers['content-length'],
      Buffer.byteLength(testData).toString()
    );
  });
});
