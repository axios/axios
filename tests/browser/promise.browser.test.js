import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import axios from '../../index.js';

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
    this.responseHeaders = '';
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.onreadystatechange = null;
    this.onloadend = null;
    this.upload = {
      addEventListener() {},
    };
  }

  open(method, url, async = true) {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(key, value) {
    this.requestHeaders[key] = value;
  }

  addEventListener() {}

  getAllResponseHeaders() {
    return this.responseHeaders;
  }

  send(data) {
    this.params = data;
    requests.push(this);
  }

  respondWith({ status = 200, statusText = 'OK', responseText = '', responseHeaders = '' } = {}) {
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
    this.response = responseText;
    this.responseHeaders = responseHeaders;
    this.readyState = 4;

    queueMicrotask(() => {
      if (this.onloadend) {
        this.onloadend();
      } else if (this.onreadystatechange) {
        this.onreadystatechange();
      }
    });
  }

  abort() {}
}

let requests = [];
let OriginalXMLHttpRequest;

const getLastRequest = () => {
  const request = requests.at(-1);

  expect(request).toBeDefined();

  return request;
};

describe('promise (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  it('should provide succinct object to then', async () => {
    const responsePromise = axios('/foo');
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '{"hello":"world"}',
      responseHeaders: 'Content-Type: application/json',
    });

    const response = await responsePromise;

    expect(typeof response).toBe('object');
    expect(response.data.hello).toBe('world');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/json');
    expect(response.config.url).toBe('/foo');
  });

  it('should support all', async () => {
    const result = await axios.all([true, 123]);

    expect(result).toEqual([true, 123]);
  });

  it('should support spread', async () => {
    let fulfilled = false;
    const result = await axios.all([123, 456]).then(
      axios.spread((a, b) => {
        expect(a + b).toBe(123 + 456);
        fulfilled = true;
        return 'hello world';
      })
    );

    expect(fulfilled).toBe(true);
    expect(result).toBe('hello world');
  });
});
