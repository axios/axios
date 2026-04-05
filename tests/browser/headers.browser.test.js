import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import axios, { AxiosHeaders } from '../../index.js';

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
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

const getLastRequest = () => {
  const request = requests.at(-1);

  expect(request).toBeDefined();

  return request;
};

const finishRequest = async (request, promise) => {
  request.respondWith({ status: 200 });
  await promise;
};

function testHeaderValue(headers, key, val) {
  let found = false;

  for (const k in headers) {
    if (k.toLowerCase() === key.toLowerCase()) {
      found = true;
      expect(headers[k]).toBe(val);
      break;
    }
  }

  if (!found) {
    if (typeof val === 'undefined') {
      expect(Object.prototype.hasOwnProperty.call(headers, key)).toBe(false);
    } else {
      throw new Error(`${key} was not found in headers`);
    }
  }
}

describe('headers (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  it('should default common headers', async () => {
    const headers = axios.defaults.headers.common;
    const promise = axios('/foo');
    const request = getLastRequest();

    for (const key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key)) {
        expect(request.requestHeaders[key]).toBe(headers[key]);
      }
    }

    await finishRequest(request, promise);
  });

  it('should respect common Content-Type header', async () => {
    const instance = axios.create();
    instance.defaults.headers.common['Content-Type'] = 'application/custom';

    const promise = instance.patch('/foo', '');
    const request = getLastRequest();

    expect(request.requestHeaders['Content-Type']).toBe('application/custom');

    await finishRequest(request, promise);
  });

  it('should add extra headers for post', async () => {
    const headers = AxiosHeaders.from(axios.defaults.headers.common).toJSON();
    const promise = axios.post('/foo', 'fizz=buzz');
    const request = getLastRequest();

    for (const key in headers) {
      expect(request.requestHeaders[key]).toBe(headers[key]);
    }

    await finishRequest(request, promise);
  });

  it('should reset headers by null or explicit undefined', async () => {
    const promise = axios.create({
      headers: {
        common: {
          'x-header-a': 'a',
          'x-header-b': 'b',
          'x-header-c': 'c',
        },
      },
    }).post(
      '/foo',
      { fizz: 'buzz' },
      {
        headers: {
          'Content-Type': null,
          'x-header-a': null,
          'x-header-b': undefined,
        },
      }
    );
    const request = getLastRequest();

    testHeaderValue(request.requestHeaders, 'Content-Type', undefined);
    testHeaderValue(request.requestHeaders, 'x-header-a', undefined);
    testHeaderValue(request.requestHeaders, 'x-header-b', undefined);
    testHeaderValue(request.requestHeaders, 'x-header-c', 'c');

    await finishRequest(request, promise);
  });

  it('should use application/json when posting an object', async () => {
    const promise = axios.post('/foo/bar', {
      firstName: 'foo',
      lastName: 'bar',
    });
    const request = getLastRequest();

    testHeaderValue(request.requestHeaders, 'Content-Type', 'application/json');

    await finishRequest(request, promise);
  });

  it('should remove content-type if data is empty', async () => {
    const promise = axios.post('/foo');
    const request = getLastRequest();

    testHeaderValue(request.requestHeaders, 'Content-Type', undefined);

    await finishRequest(request, promise);
  });

  it('should preserve content-type if data is false', async () => {
    const promise = axios.post('/foo', false);
    const request = getLastRequest();

    testHeaderValue(request.requestHeaders, 'Content-Type', 'application/x-www-form-urlencoded');

    await finishRequest(request, promise);
  });

  it('should allow an AxiosHeaders instance to be used as the value of the headers option', async () => {
    const instance = axios.create({
      headers: new AxiosHeaders({
        xFoo: 'foo',
        xBar: 'bar',
      }),
    });

    const promise = instance.get('/foo', {
      headers: {
        XFOO: 'foo2',
        xBaz: 'baz',
      },
    });
    const request = getLastRequest();

    expect(request.requestHeaders.xFoo).toBe('foo2');
    expect(request.requestHeaders.xBar).toBe('bar');
    expect(request.requestHeaders.xBaz).toBe('baz');
    expect(request.requestHeaders.XFOO).toBeUndefined();

    await finishRequest(request, promise);
  });
});
