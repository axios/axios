import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import axios from '../../index.js';
import AxiosError from '../../lib/core/AxiosError.js';

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
    this.responseHeaders = '';
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.timeout = 0;
    this.onreadystatechange = null;
    this.onloadend = null;
    this.onabort = null;
    this.onerror = null;
    this.ontimeout = null;
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

describe('transform (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  it('should transform JSON to string', async () => {
    const responsePromise = axios.post('/foo', { foo: 'bar' });
    const request = getLastRequest();

    expect(request.params).toBe('{"foo":"bar"}');

    request.respondWith();
    await responsePromise;
  });

  it('should transform string to JSON', async () => {
    const responsePromise = axios('/foo');
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });

    const response = await responsePromise;

    expect(typeof response.data).toBe('object');
    expect(response.data.foo).toBe('bar');
  });

  it('should throw a SyntaxError if JSON parsing failed and responseType is "json" if silentJSONParsing is false', async () => {
    const responsePromise = axios({
      url: '/foo',
      responseType: 'json',
      transitional: { silentJSONParsing: false },
    });
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '{foo": "bar"}',
    });

    const thrown = await responsePromise.catch((error) => error);

    expect(thrown).toBeTruthy();
    expect(thrown.name).toContain('SyntaxError');
    expect(thrown.code).toBe(AxiosError.ERR_BAD_RESPONSE);
  });

  it('should send data as JSON if request content-type is application/json', async () => {
    const responsePromise = axios.post('/foo', 123, {
      headers: { 'Content-Type': 'application/json' },
    });
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '',
    });

    const response = await responsePromise;

    expect(response).toBeTruthy();
    expect(request.requestHeaders['Content-Type']).toBe('application/json');
    expect(JSON.parse(request.params)).toBe(123);
  });

  it('should not assume JSON if responseType is not `json`', async () => {
    const responsePromise = axios.get('/foo', {
      responseType: 'text',
      transitional: {
        forcedJSONParsing: false,
      },
    });
    const request = getLastRequest();
    const rawData = '{"x":1}';

    request.respondWith({
      status: 200,
      responseText: rawData,
    });

    const response = await responsePromise;

    expect(response).toBeTruthy();
    expect(response.data).toBe(rawData);
  });

  it('should override default transform', async () => {
    const responsePromise = axios.post(
      '/foo',
      { foo: 'bar' },
      {
        transformRequest(data) {
          return data;
        },
      }
    );
    const request = getLastRequest();

    expect(typeof request.params).toBe('object');

    request.respondWith();
    await responsePromise;
  });

  it('should allow an Array of transformers', async () => {
    const responsePromise = axios.post(
      '/foo',
      { foo: 'bar' },
      {
        transformRequest: axios.defaults.transformRequest.concat(function (data) {
          return data.replace('bar', 'baz');
        }),
      }
    );
    const request = getLastRequest();

    expect(request.params).toBe('{"foo":"baz"}');

    request.respondWith();
    await responsePromise;
  });

  it('should allowing mutating headers', async () => {
    const token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);
    const responsePromise = axios('/foo', {
      transformRequest(data, headers) {
        headers['X-Authorization'] = token;
        return data;
      },
    });
    const request = getLastRequest();

    expect(request.requestHeaders['X-Authorization']).toBe(token);

    request.respondWith();
    await responsePromise;
  });

  it("should normalize 'content-type' header when using a custom transformRequest", async () => {
    const responsePromise = axios.post(
      '/foo',
      { foo: 'bar' },
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        transformRequest: [
          function () {
            return 'aa=44';
          },
        ],
      }
    );
    const request = getLastRequest();

    expect(request.requestHeaders['Content-Type']).toBe('application/x-www-form-urlencoded');

    request.respondWith();
    await responsePromise;
  });

  it('should return response.data as parsed JSON object when responseType is json', async () => {
    const instance = axios.create({
      baseURL: '/api',
      responseType: 'json',
    });
    const responsePromise = instance.get('my/endpoint', { responseType: 'json' });
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '{"key1": "value1"}',
      responseHeaders: 'content-type: application/json',
    });

    const response = await responsePromise;

    expect(response).toBeTruthy();
    expect(response.data).toEqual({ key1: 'value1' });
  });
});
