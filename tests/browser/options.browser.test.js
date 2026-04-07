import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('options (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    vi.restoreAllMocks();
  });

  it('should default method to get', async () => {
    const { request, promise } = startRequest('/foo');

    expect(request.method).toBe('GET');

    await flushSuccess(request, promise);
  });

  it('should accept headers', async () => {
    const { request, promise } = startRequest('/foo', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    expect(request.requestHeaders['X-Requested-With']).toBe('XMLHttpRequest');

    await flushSuccess(request, promise);
  });

  it('should accept params', async () => {
    const { request, promise } = startRequest('/foo', {
      params: {
        foo: 123,
        bar: 456,
      },
    });

    expect(request.url).toBe('/foo?foo=123&bar=456');

    await flushSuccess(request, promise);
  });

  it('should allow overriding default headers', async () => {
    const { request, promise } = startRequest('/foo', {
      headers: {
        Accept: 'foo/bar',
      },
    });

    expect(request.requestHeaders.Accept).toBe('foo/bar');

    await flushSuccess(request, promise);
  });

  it('should accept base URL', async () => {
    const instance = axios.create({
      baseURL: 'http://test.com/',
    });

    const promise = instance.get('/foo');
    const request = requests.at(-1);

    expect(request).toBeDefined();
    expect(request.url).toBe('http://test.com/foo');

    await flushSuccess(request, promise);
  });

  it('should warn about baseUrl', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = axios.create({
      baseUrl: 'http://example.com/',
    });

    const promise = instance.get('/foo');
    const request = requests.at(-1);

    expect(request).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith('baseUrl is likely a misspelling of baseURL');
    expect(request.url).toBe('/foo');

    await flushSuccess(request, promise);
  });

  it('should ignore base URL if request URL is absolute', async () => {
    const instance = axios.create({
      baseURL: 'http://someurl.com/',
    });

    const promise = instance.get('http://someotherurl.com/');
    const request = requests.at(-1);

    expect(request).toBeDefined();
    expect(request.url).toBe('http://someotherurl.com/');

    await flushSuccess(request, promise);
  });

  it('should combine the URLs if base url and request url exist and allowAbsoluteUrls is false', async () => {
    const instance = axios.create({
      baseURL: 'http://someurl.com/',
      allowAbsoluteUrls: false,
    });

    const promise = instance.get('http://someotherurl.com/');
    const request = requests.at(-1);

    expect(request).toBeDefined();
    expect(request.url).toBe('http://someurl.com/http://someotherurl.com/');

    await flushSuccess(request, promise);
  });

  it('should change only the baseURL of the specified instance', () => {
    const instance1 = axios.create();
    const instance2 = axios.create();

    instance1.defaults.baseURL = 'http://instance1.example.com/';

    expect(instance2.defaults.baseURL).not.toBe('http://instance1.example.com/');
  });

  it('should change only the headers of the specified instance', () => {
    const instance1 = axios.create();
    const instance2 = axios.create();

    instance1.defaults.headers.common.Authorization = 'faketoken';
    instance2.defaults.headers.common.Authorization = 'differentfaketoken';

    instance1.defaults.headers.common['Content-Type'] = 'application/xml';
    instance2.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

    expect(axios.defaults.headers.common.Authorization).toBeUndefined();
    expect(instance1.defaults.headers.common.Authorization).toBe('faketoken');
    expect(instance2.defaults.headers.common.Authorization).toBe('differentfaketoken');

    expect(axios.defaults.headers.common['Content-Type']).toBeUndefined();
    expect(instance1.defaults.headers.common['Content-Type']).toBe('application/xml');
    expect(instance2.defaults.headers.common['Content-Type']).toBe('application/x-www-form-urlencoded');
  });
});
