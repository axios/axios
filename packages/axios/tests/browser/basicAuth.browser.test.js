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

    expect(request.requestHeaders.Authorization).toBe(
      'Basic QWxhZGRpbjpvcGVuIMOfw6fCo+KYg3Nlc2FtZQ=='
    );

    await flushSuccess(request, promise);
  });

  it('should ignore inherited nested auth fields', async () => {
    Object.defineProperty(Object.prototype, 'username', {
      value: 'inherited-user',
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'password', {
      value: 'inherited-pass',
      configurable: true,
    });

    try {
      const { request, promise } = startRequest('/foo', {
        auth: {},
      });

      expect(request.requestHeaders.Authorization).toBe('Basic Og==');

      await flushSuccess(request, promise);
    } finally {
      delete Object.prototype.username;
      delete Object.prototype.password;
    }
  });

  it('should fail to encode HTTP Basic auth credentials with non-Latin1 characters in username', async () => {
    await expect(
      axios('/foo', {
        auth: {
          username: 'Aladßç£☃din',
          password: 'open sesame',
        },
      })
    ).rejects.toThrow(/character/i);
  });

  it.each([undefined, false])('preserves Latin-1 usernames with opt-in %s', async (enabled) => {
    const { request, promise } = startRequest('/foo', {
      adapter: 'xhr',
      auth: { username: 'naïve', password: 'x' },
      transitional: { encodeBasicAuthUsername: enabled },
    });

    expect(request.requestHeaders.Authorization).toBe('Basic bmHvdmU6eA==');
    await flushSuccess(request, promise);
  });

  it.each([
    ['naïve', 'Basic bmHDr3ZlOng='],
    ['π', 'Basic z4A6eA=='],
    ['😀', 'Basic 8J+YgDp4'],
  ])('encodes the username %s as UTF-8 when opted in', async (username, expected) => {
    const { request, promise } = startRequest('/foo', {
      adapter: 'xhr',
      auth: { username, password: 'x' },
      transitional: { encodeBasicAuthUsername: true },
    });

    expect(request.requestHeaders.Authorization).toBe(expected);
    await flushSuccess(request, promise);
  });

  it('allows a request to disable the instance UTF-8 opt-in', async () => {
    const instance = axios.create({
      adapter: 'xhr',
      auth: { username: 'naïve', password: 'x' },
      transitional: { encodeBasicAuthUsername: true },
    });

    for (const [config, expected] of [
      [{}, 'Basic bmHDr3ZlOng='],
      [{ transitional: { encodeBasicAuthUsername: false } }, 'Basic bmHvdmU6eA=='],
      [{}, 'Basic bmHDr3ZlOng='],
    ]) {
      const promise = instance.get('/foo', config);
      const request = requests.at(-1);
      expect(request.requestHeaders.Authorization).toBe(expected);
      await flushSuccess(request, promise);
    }
  });

  it.each(['username', 'password'])('rejects malformed UTF-16 in %s when opted in', async (key) => {
    await expect(
      axios('/foo', {
        adapter: 'xhr',
        auth: { username: 'user', password: 'x', [key]: '\uD800' },
        transitional: { encodeBasicAuthUsername: true },
      })
    ).rejects.toMatchObject({ code: 'ERR_BAD_OPTION_VALUE', isAxiosError: true });
    expect(requests).toHaveLength(0);
  });
});
