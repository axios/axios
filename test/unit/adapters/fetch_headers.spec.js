import assert from 'assert';
import axios from '../../../index.js';

describe('fetch adapter headers', function () {
  this.timeout(5000);

  it('should include User-Agent header', async function () {
    const response = await axios.post('https://httpbin.org/post', 'test', {
      adapter: 'fetch',
      headers: { 'Content-Type': 'text/plain' }
    });

    assert.ok(response.data.headers['User-Agent']);
    assert.strictEqual(response.data.headers['User-Agent'], 'axios/1.13.6');
  });

  it('should include Content-Length header', async function () {
    const testData = 'Hello World';
    const response = await axios.post('https://httpbin.org/post', testData, {
      adapter: 'fetch',
      headers: { 'Content-Type': 'text/plain' }
    });

    assert.ok(response.data.headers['Content-Length']);
    assert.strictEqual(response.data.headers['Content-Length'], testData.length.toString());
  });

  it('should include Accept-Encoding header', async function () {
    const response = await axios.get('https://httpbin.org/get', {
      adapter: 'fetch'
    });

    assert.ok(response.data.headers['Accept-Encoding']);
    assert.ok(response.data.headers['Accept-Encoding'].includes('gzip'));
    assert.ok(response.data.headers['Accept-Encoding'].includes('deflate'));
    assert.ok(response.data.headers['Accept-Encoding'].includes('br'));
  });

  it('should include Host header', async function () {
    const response = await axios.get('https://httpbin.org/get', {
      adapter: 'fetch'
    });

    assert.ok(response.data.headers['Host']);
    assert.strictEqual(response.data.headers['Host'], 'httpbin.org');
  });

  it('should not override user-provided headers', async function () {
    const customUserAgent = 'Custom-Agent/1.0';
    const response = await axios.get('https://httpbin.org/get', {
      adapter: 'fetch',
      headers: { 'User-Agent': customUserAgent }
    });

    assert.strictEqual(response.data.headers['User-Agent'], customUserAgent);
  });

  it('should handle different data types for Content-Length', async function () {
    const testData = JSON.stringify({ key: 'value' });
    const response = await axios.post('https://httpbin.org/post', testData, {
      adapter: 'fetch',
      headers: { 'Content-Type': 'application/json' }
    });

    assert.ok(response.data.headers['Content-Length']);
    assert.strictEqual(response.data.headers['Content-Length'], testData.length.toString());
  });
});
