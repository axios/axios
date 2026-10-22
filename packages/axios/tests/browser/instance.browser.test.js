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
}

let requests = [];
let OriginalXMLHttpRequest;

const getLastRequest = () => {
  const request = requests.at(-1);

  expect(request).toBeDefined();

  return request;
};

const flushSuccess = async (request, promise) => {
  request.respondWith({ status: 200 });
  await promise;
};

const waitForRequest = async (timeoutMs = 1000) => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const request = requests.at(-1);
    if (request) {
      return request;
    }

    await Promise.resolve();
  }

  throw new Error('Expected an XHR request to be sent');
};

describe('instance (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  it('should have the same methods as default instance', () => {
    const instance = axios.create();

    for (const prop in axios) {
      if (
        [
          'Axios',
          'AxiosError',
          'create',
          'Cancel',
          'CanceledError',
          'CancelToken',
          'isCancel',
          'all',
          'spread',
          'getUri',
          'isAxiosError',
          'mergeConfig',
          'getAdapter',
          'VERSION',
          'default',
          'toFormData',
          'formToJSON',
          'AxiosHeaders',
          'HttpStatusCode',
        ].includes(prop)
      ) {
        continue;
      }

      expect(typeof instance[prop]).toBe(typeof axios[prop]);
    }
  });

  it('should make an http request without verb helper', async () => {
    const instance = axios.create();
    const promise = instance('/foo');
    const request = getLastRequest();

    expect(request.url).toBe('/foo');

    await flushSuccess(request, promise);
  });

  it('should make an http request with url instead of baseURL', async () => {
    const instance = axios.create({
      url: 'https://api.example.com',
    });
    const promise = instance('/foo');
    const request = getLastRequest();

    expect(request.url).toBe('/foo');

    await flushSuccess(request, promise);
  });

  it('should make an http request', async () => {
    const instance = axios.create();
    const promise = instance.get('/foo');
    const request = getLastRequest();

    expect(request.url).toBe('/foo');

    await flushSuccess(request, promise);
  });

  it('should use instance options', async () => {
    const instance = axios.create({ timeout: 1000 });
    const promise = instance.get('/foo');
    const request = getLastRequest();

    expect(request.timeout).toBe(1000);

    await flushSuccess(request, promise);
  });

  it('should have defaults.headers', () => {
    const instance = axios.create({
      baseURL: 'https://api.example.com',
    });

    expect(typeof instance.defaults.headers).toBe('object');
    expect(typeof instance.defaults.headers.common).toBe('object');
  });

  it('should have interceptors on the instance', async () => {
    const requestInterceptorId = axios.interceptors.request.use((config) => {
      config.foo = true;
      return config;
    });

    const instance = axios.create();
    const instanceInterceptorId = instance.interceptors.request.use((config) => {
      config.bar = true;
      return config;
    });

    try {
      const responsePromise = instance.get('/foo');
      const request = await waitForRequest();

      request.respondWith({
        status: 200,
      });

      const response = await responsePromise;

      expect(response.config.foo).toBeUndefined();
      expect(response.config.bar).toBe(true);
    } finally {
      axios.interceptors.request.eject(requestInterceptorId);
      instance.interceptors.request.eject(instanceInterceptorId);
    }
  });

  it('should have getUri on the instance', () => {
    const instance = axios.create({
      baseURL: 'https://api.example.com',
    });
    const options = {
      url: 'foo/bar',
      params: {
        name: 'axios',
      },
    };

    expect(instance.getUri(options)).toBe('https://api.example.com/foo/bar?name=axios');
  });

  it('should correctly build url without baseURL', () => {
    const instance = axios.create();
    const options = {
      url: 'foo/bar?foo=bar',
      params: {
        name: 'axios',
      },
    };

    expect(instance.getUri(options)).toBe('foo/bar?foo=bar&name=axios');
  });

  it('should correctly discard url hash mark', () => {
    const instance = axios.create();
    const options = {
      baseURL: 'https://api.example.com',
      url: 'foo/bar?foo=bar#hash',
      params: {
        name: 'axios',
      },
    };

    expect(instance.getUri(options)).toBe('https://api.example.com/foo/bar?foo=bar&name=axios');
  });
});
