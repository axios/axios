import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import axios from '../../index.js';
import defaults from '../../lib/defaults/index.js';
import AxiosHeaders from '../../lib/core/AxiosHeaders.js';

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

const XSRF_COOKIE_NAME = 'CUSTOM-XSRF-TOKEN';

let requests = [];
let OriginalXMLHttpRequest;

const getLastRequest = () => {
  const request = requests.at(-1);

  expect(request).toBeDefined();

  return request;
};

const finishRequest = async (request, promise) => {
  request.respondWith({ status: 200 });
  await promise;
};

describe('defaults (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    delete axios.defaults.baseURL;
    delete axios.defaults.headers.get['X-CUSTOM-HEADER'];
    delete axios.defaults.headers.post['X-CUSTOM-HEADER'];
    document.cookie = `${XSRF_COOKIE_NAME}=;expires=${new Date(Date.now() - 86400000).toUTCString()}`;
  });

  it('should transform request json', () => {
    expect(defaults.transformRequest[0]({ foo: 'bar' }, new AxiosHeaders())).toBe('{"foo":"bar"}');
  });

  it("should also transform request json when 'Content-Type' is 'application/json'", () => {
    const headers = new AxiosHeaders({
      'Content-Type': 'application/json',
    });

    expect(defaults.transformRequest[0](JSON.stringify({ foo: 'bar' }), headers)).toBe('{"foo":"bar"}');
    expect(defaults.transformRequest[0]([42, 43], headers)).toBe('[42,43]');
    expect(defaults.transformRequest[0]('foo', headers)).toBe('"foo"');
    expect(defaults.transformRequest[0](42, headers)).toBe('42');
    expect(defaults.transformRequest[0](true, headers)).toBe('true');
    expect(defaults.transformRequest[0](false, headers)).toBe('false');
    expect(defaults.transformRequest[0](null, headers)).toBe('null');
  });

  it("should transform the plain data object to a FormData instance when header is 'multipart/form-data'", () => {
    const headers = new AxiosHeaders({
      'Content-Type': 'multipart/form-data',
    });

    const transformed = defaults.transformRequest[0]({ x: 1 }, headers);

    expect(transformed).toBeInstanceOf(FormData);
  });

  it('should do nothing to request string', () => {
    expect(defaults.transformRequest[0]('foo=bar', new AxiosHeaders())).toBe('foo=bar');
  });

  it('should transform response json', () => {
    const data = defaults.transformResponse[0].call(defaults, '{"foo":"bar"}');

    expect(typeof data).toBe('object');
    expect(data.foo).toBe('bar');
  });

  it('should do nothing to response string', () => {
    expect(defaults.transformResponse[0]('foo=bar')).toBe('foo=bar');
  });

  it('should use global defaults config', async () => {
    const promise = axios('/foo');
    const request = getLastRequest();

    expect(request.url).toBe('/foo');

    await finishRequest(request, promise);
  });

  it('should use modified defaults config', async () => {
    axios.defaults.baseURL = 'http://example.com/';

    const promise = axios('/foo');
    const request = getLastRequest();

    expect(request.url).toBe('http://example.com/foo');

    await finishRequest(request, promise);
  });

  it('should use request config', async () => {
    const promise = axios('/foo', {
      baseURL: 'http://www.example.com',
    });
    const request = getLastRequest();

    expect(request.url).toBe('http://www.example.com/foo');

    await finishRequest(request, promise);
  });

  it('should use default config for custom instance', async () => {
    const instance = axios.create({
      xsrfCookieName: XSRF_COOKIE_NAME,
      xsrfHeaderName: 'X-CUSTOM-XSRF-TOKEN',
    });
    document.cookie = `${instance.defaults.xsrfCookieName}=foobarbaz`;

    const promise = instance.get('/foo');
    const request = getLastRequest();

    expect(request.requestHeaders[instance.defaults.xsrfHeaderName]).toBe('foobarbaz');

    await finishRequest(request, promise);
  });

  it('should use GET headers', async () => {
    axios.defaults.headers.get['X-CUSTOM-HEADER'] = 'foo';

    const promise = axios.get('/foo');
    const request = getLastRequest();

    expect(request.requestHeaders['X-CUSTOM-HEADER']).toBe('foo');

    await finishRequest(request, promise);
  });

  it('should use POST headers', async () => {
    axios.defaults.headers.post['X-CUSTOM-HEADER'] = 'foo';

    const promise = axios.post('/foo', {});
    const request = getLastRequest();

    expect(request.requestHeaders['X-CUSTOM-HEADER']).toBe('foo');

    await finishRequest(request, promise);
  });

  it('should use header config', async () => {
    const instance = axios.create({
      headers: {
        common: {
          'X-COMMON-HEADER': 'commonHeaderValue',
        },
        get: {
          'X-GET-HEADER': 'getHeaderValue',
        },
        post: {
          'X-POST-HEADER': 'postHeaderValue',
        },
      },
    });

    const promise = instance.get('/foo', {
      headers: {
        'X-FOO-HEADER': 'fooHeaderValue',
        'X-BAR-HEADER': 'barHeaderValue',
      },
    });
    const request = getLastRequest();

    expect(request.requestHeaders).toEqual(
      AxiosHeaders.concat(defaults.headers.common, defaults.headers.get, {
        'X-COMMON-HEADER': 'commonHeaderValue',
        'X-GET-HEADER': 'getHeaderValue',
        'X-FOO-HEADER': 'fooHeaderValue',
        'X-BAR-HEADER': 'barHeaderValue',
      }).toJSON()
    );

    await finishRequest(request, promise);
  });

  it('should be used by custom instance if set before instance created', async () => {
    axios.defaults.baseURL = 'http://example.org/';
    const instance = axios.create();

    const promise = instance.get('/foo');
    const request = getLastRequest();

    expect(request.url).toBe('http://example.org/foo');

    await finishRequest(request, promise);
  });

  it('should not be used by custom instance if set after instance created', async () => {
    const instance = axios.create();
    axios.defaults.baseURL = 'http://example.org/';

    const promise = instance.get('/foo/users');
    const request = getLastRequest();

    expect(request.url).toBe('/foo/users');

    await finishRequest(request, promise);
  });

  it('should resistant to ReDoS attack', async () => {
    const instance = axios.create();
    const start = performance.now();
    const slashes = '/'.repeat(100000);
    instance.defaults.baseURL = `/${slashes}bar/`;

    const promise = instance.get('/foo');
    const request = getLastRequest();
    const elapsedTimeMs = performance.now() - start;

    expect(elapsedTimeMs).toBeLessThan(20);
    expect(request.url).toBe(`/${slashes}bar/foo`);

    await finishRequest(request, promise);
  });
});
