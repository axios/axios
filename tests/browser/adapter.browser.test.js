import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import axios from '../../index.js';

class MockXMLHttpRequest {
  constructor() {
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
    this.requestHeaders = {};
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
    return '';
  }

  send(data) {
    this.params = data;
    requests.push(this);
  }

  respondWith({ status = 200, statusText = 'OK', responseText = '' } = {}) {
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
    this.response = responseText;
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

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForRequest = async (timeoutMs = 1000) => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const request = requests.at(-1);
    if (request) {
      return request;
    }

    await sleep(0);
  }

  throw new Error('Expected an XHR request to be sent');
};

describe('adapter (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];
  });

  it('should support custom adapter', async () => {
    const responsePromise = axios('/foo', {
      adapter(config) {
        return new Promise((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function onReadyStateChange() {
            resolve({
              config,
              request,
            });
          };

          request.send(null);
        });
      },
    });

    const request = await waitForRequest();
    expect(request.url).toBe('/bar');

    request.respondWith();
    await responsePromise;
  });

  it('should execute adapter code synchronously', async () => {
    let asyncFlag = false;

    const responsePromise = axios('/foo', {
      adapter(config) {
        return new Promise((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function onReadyStateChange() {
            resolve({
              config,
              request,
            });
          };

          expect(asyncFlag).toBe(false);
          request.send(null);
        });
      },
    });

    asyncFlag = true;

    const request = await waitForRequest();
    request.respondWith();
    await responsePromise;
  });

  it('should execute adapter code asynchronously when interceptor is present', async () => {
    let asyncFlag = false;

    axios.interceptors.request.use((config) => {
      config.headers.async = 'async it!';
      return config;
    });

    const responsePromise = axios('/foo', {
      adapter(config) {
        return new Promise((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function onReadyStateChange() {
            resolve({
              config,
              request,
            });
          };

          expect(asyncFlag).toBe(true);
          request.send(null);
        });
      },
    });

    asyncFlag = true;

    const request = await waitForRequest();
    request.respondWith();
    await responsePromise;
  });

  it('should reject request headers containing CRLF characters', async () => {
    await expect(
      axios('/foo', {
        headers: {
          'x-test': 'ok\r\nInjected: yes',
        },
      })
    ).rejects.toThrow(/Invalid character in header content/);

    expect(requests.length).toBe(0);
  });
});
