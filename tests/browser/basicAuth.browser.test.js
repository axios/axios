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

const startRequest = (...args) => {
  const promise = axios(...args);
  const request = requests.at(-1);

  expect(request).toBeDefined();

  return { request, promise };
};

const flushSuccess = async (request, promise) => {
  request.respondWith({ status: 200 });
  await promise;
};

describe('basicAuth (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  it('should accept HTTP Basic auth with username/password', async () => {
    const { request, promise } = startRequest('/foo', {
      auth: {
        username: 'Aladdin',
        password: 'open sesame',
      },
    });

    expect(request.requestHeaders.Authorization).toBe('Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');

    await flushSuccess(request, promise);
  });

  it('should accept HTTP Basic auth credentials without the password parameter', async () => {
    const { request, promise } = startRequest('/foo', {
      auth: {
        username: 'Aladdin',
      },
    });

    expect(request.requestHeaders.Authorization).toBe('Basic QWxhZGRpbjo=');

    await flushSuccess(request, promise);
  });

  it('should accept HTTP Basic auth credentials with non-Latin1 characters in password', async () => {
    const { request, promise } = startRequest('/foo', {
      auth: {
        username: 'Aladdin',
        password: 'open ßç£☃sesame',
      },
    });

    expect(request.requestHeaders.Authorization).toBe('Basic QWxhZGRpbjpvcGVuIMOfw6fCo+KYg3Nlc2FtZQ==');

    await flushSuccess(request, promise);
  });

  it('should fail to encode HTTP Basic auth credentials with non-Latin1 characters in username', async () => {
    await expect(axios('/foo', {
      auth: {
        username: 'Aladßç£☃din',
        password: 'open sesame',
      },
    })).rejects.toThrow(/character/i);
  });
});
