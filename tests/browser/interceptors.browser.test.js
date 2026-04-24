import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import axios from '../../index.js';

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
    this.responseHeaders = {};
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.responseURL = '';
    this.timeout = 0;
    this.withCredentials = false;
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
    if (typeof this.responseHeaders === 'string') {
      return this.responseHeaders;
    }

    return Object.entries(this.responseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  send(data) {
    this.params = data;
    requests.push(this);
    this.readyState = 1;
  }

  respondWith({
    status = 200,
    statusText = 'OK',
    responseText = '',
    response = null,
    responseHeaders = {},
    headers = {},
    responseURL = '',
  } = {}) {
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
    this.response = response === null ? responseText : response;
    this.responseHeaders = Object.keys(headers).length ? headers : responseHeaders;
    this.responseURL = responseURL;
    this.readyState = 4;
    this.finish();
  }

  responseTimeout() {
    if (this.ontimeout) {
      this.ontimeout();
    }
  }

  failNetworkError(message = 'Network Error') {
    if (this.onerror) {
      this.onerror({ message });
    }
  }

  abort() {
    if (this.onabort) {
      this.onabort();
    }
  }

  finish() {
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

describe('interceptors (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];
    vi.restoreAllMocks();
  });

  it('should add a request interceptor (asynchronous by default)', async () => {
    let asyncFlag = false;

    axios.interceptors.request.use((config) => {
      config.headers.test = 'added by interceptor';
      expect(asyncFlag).toBe(true);
      return config;
    });

    const responsePromise = axios('/foo');
    asyncFlag = true;

    const request = await waitForRequest();
    expect(request.requestHeaders.test).toBe('added by interceptor');
    request.respondWith();
    await responsePromise;
  });

  it('should add a request interceptor (explicitly flagged as asynchronous)', async () => {
    let asyncFlag = false;

    axios.interceptors.request.use(
      (config) => {
        config.headers.test = 'added by interceptor';
        expect(asyncFlag).toBe(true);
        return config;
      },
      null,
      { synchronous: false }
    );

    const responsePromise = axios('/foo');
    asyncFlag = true;

    const request = await waitForRequest();
    expect(request.requestHeaders.test).toBe('added by interceptor');
    request.respondWith();
    await responsePromise;
  });

  it('should add a request interceptor that is executed synchronously when flag is provided', async () => {
    let asyncFlag = false;

    axios.interceptors.request.use(
      (config) => {
        config.headers.test = 'added by synchronous interceptor';
        expect(asyncFlag).toBe(false);
        return config;
      },
      null,
      { synchronous: true }
    );

    const responsePromise = axios('/foo');
    asyncFlag = true;

    const request = await waitForRequest();
    expect(request.requestHeaders.test).toBe('added by synchronous interceptor');
    request.respondWith();
    await responsePromise;
  });

  it('should execute asynchronously when not all interceptors are explicitly flagged as synchronous', async () => {
    let asyncFlag = false;

    axios.interceptors.request.use((config) => {
      config.headers.foo = 'uh oh, async';
      expect(asyncFlag).toBe(true);
      return config;
    });

    axios.interceptors.request.use(
      (config) => {
        config.headers.test = 'added by synchronous interceptor';
        expect(asyncFlag).toBe(true);
        return config;
      },
      null,
      { synchronous: true }
    );

    axios.interceptors.request.use((config) => {
      config.headers.test = 'added by the async interceptor';
      expect(asyncFlag).toBe(true);
      return config;
    });

    const responsePromise = axios('/foo');
    asyncFlag = true;

    const request = await waitForRequest();
    expect(request.requestHeaders.foo).toBe('uh oh, async');
    expect(request.requestHeaders.test).toBe('added by synchronous interceptor');
    request.respondWith();
    await responsePromise;
  });

  it('should execute request interceptor in legacy order', async () => {
    let sequence = '';

    axios.interceptors.request.use((config) => {
      sequence += '1';
      return config;
    });

    axios.interceptors.request.use((config) => {
      sequence += '2';
      return config;
    });

    axios.interceptors.request.use((config) => {
      sequence += '3';
      return config;
    });

    const responsePromise = axios({ url: '/foo' });
    const request = await waitForRequest();

    expect(sequence).toBe('321');
    request.respondWith();
    await responsePromise;
  });

  it('should execute request interceptor in order', async () => {
    let sequence = '';

    axios.interceptors.request.use((config) => {
      sequence += '1';
      return config;
    });

    axios.interceptors.request.use((config) => {
      sequence += '2';
      return config;
    });

    axios.interceptors.request.use((config) => {
      sequence += '3';
      return config;
    });

    const responsePromise = axios({
      url: '/foo',
      transitional: {
        legacyInterceptorReqResOrdering: false,
      },
    });
    const request = await waitForRequest();

    expect(sequence).toBe('123');
    request.respondWith();
    await responsePromise;
  });

  it('runs the interceptor if runWhen function is provided and resolves to true', async () => {
    const onGetCall = (config) => config.method === 'get';

    axios.interceptors.request.use(
      (config) => {
        config.headers.test = 'special get headers';
        return config;
      },
      null,
      { runWhen: onGetCall }
    );

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    expect(request.requestHeaders.test).toBe('special get headers');
    request.respondWith();
    await responsePromise;
  });

  it('does not run the interceptor if runWhen function is provided and resolves to false', async () => {
    const onPostCall = (config) => config.method === 'post';

    axios.interceptors.request.use(
      (config) => {
        config.headers.test = 'special get headers';
        return config;
      },
      null,
      { runWhen: onPostCall }
    );

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    expect(request.requestHeaders.test).toBeUndefined();
    request.respondWith();
    await responsePromise;
  });

  it('does not run async interceptor if runWhen resolves to false (and runs synchronously)', async () => {
    let asyncFlag = false;
    const onPostCall = (config) => config.method === 'post';

    axios.interceptors.request.use(
      (config) => {
        config.headers.test = 'special get headers';
        return config;
      },
      null,
      { synchronous: false, runWhen: onPostCall }
    );

    axios.interceptors.request.use(
      (config) => {
        config.headers.sync = 'hello world';
        expect(asyncFlag).toBe(false);
        return config;
      },
      null,
      { synchronous: true }
    );

    const responsePromise = axios('/foo');
    asyncFlag = true;

    const request = await waitForRequest();
    expect(request.requestHeaders.test).toBeUndefined();
    expect(request.requestHeaders.sync).toBe('hello world');
    request.respondWith();
    await responsePromise;
  });

  it('should call request onRejected when interceptor throws', async () => {
    const rejectedSpy = vi.fn();
    const error = new Error('deadly error');

    axios.interceptors.request.use(
      () => {
        throw error;
      },
      rejectedSpy,
      { synchronous: true }
    );

    const responsePromise = axios('/foo').catch(() => {});
    const request = await waitForRequest();
    request.respondWith();
    await responsePromise;

    expect(rejectedSpy).toHaveBeenCalledWith(error);
  });

  it('should add a request interceptor that returns a new config object', async () => {
    axios.interceptors.request.use(() => ({
      url: '/bar',
      method: 'post',
    }));

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    expect(request.method).toBe('POST');
    expect(request.url).toBe('/bar');
    request.respondWith();
    await responsePromise;
  });

  it('should add a request interceptor that returns a promise', async () => {
    axios.interceptors.request.use((config) =>
      new Promise((resolve) => {
        setTimeout(() => {
          config.headers.async = 'promise';
          resolve(config);
        }, 100);
      })
    );

    const responsePromise = axios('/foo');
    const request = await waitForRequest(1500);

    expect(request.requestHeaders.async).toBe('promise');
    request.respondWith();
    await responsePromise;
  });

  it('should add multiple request interceptors', async () => {
    axios.interceptors.request.use((config) => {
      config.headers.test1 = '1';
      return config;
    });
    axios.interceptors.request.use((config) => {
      config.headers.test2 = '2';
      return config;
    });
    axios.interceptors.request.use((config) => {
      config.headers.test3 = '3';
      return config;
    });

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    expect(request.requestHeaders.test1).toBe('1');
    expect(request.requestHeaders.test2).toBe('2');
    expect(request.requestHeaders.test3).toBe('3');
    request.respondWith();
    await responsePromise;
  });

  it('should add a response interceptor', async () => {
    axios.interceptors.response.use((data) => {
      data.data = `${data.data} - modified by interceptor`;
      return data;
    });

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    request.respondWith({
      status: 200,
      responseText: 'OK',
    });

    const response = await responsePromise;
    expect(response.data).toBe('OK - modified by interceptor');
  });

  it('should add a response interceptor when request interceptor is defined', async () => {
    axios.interceptors.request.use((data) => data);

    axios.interceptors.response.use((data) => {
      data.data = `${data.data} - modified by interceptor`;
      return data;
    });

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    request.respondWith({
      status: 200,
      responseText: 'OK',
    });

    const response = await responsePromise;
    expect(response.data).toBe('OK - modified by interceptor');
  });

  it('should add a response interceptor that returns a new data object', async () => {
    axios.interceptors.response.use(() => ({
      data: 'stuff',
    }));

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    request.respondWith({
      status: 200,
      responseText: 'OK',
    });

    const response = await responsePromise;
    expect(response.data).toBe('stuff');
  });

  it('should add a response interceptor that returns a promise', async () => {
    axios.interceptors.response.use((data) =>
      new Promise((resolve) => {
        setTimeout(() => {
          data.data = 'you have been promised!';
          resolve(data);
        }, 10);
      })
    );

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    request.respondWith({
      status: 200,
      responseText: 'OK',
    });

    const response = await responsePromise;
    expect(response.data).toBe('you have been promised!');
  });

  describe('given multiple response interceptors', () => {
    const fireRequest = async () => {
      const responsePromise = axios('/foo');
      const request = await waitForRequest();

      request.respondWith({
        status: 200,
        responseText: 'OK',
      });

      return responsePromise;
    };

    it('then each interceptor is executed', async () => {
      const interceptor1 = vi.fn((response) => response);
      const interceptor2 = vi.fn((response) => response);

      axios.interceptors.response.use(interceptor1);
      axios.interceptors.response.use(interceptor2);

      await fireRequest();

      expect(interceptor1).toHaveBeenCalled();
      expect(interceptor2).toHaveBeenCalled();
    });

    it('then they are executed in the order they were added', async () => {
      const interceptor1 = vi.fn((response) => response);
      const interceptor2 = vi.fn((response) => response);

      axios.interceptors.response.use(interceptor1);
      axios.interceptors.response.use(interceptor2);

      await fireRequest();

      expect(interceptor1.mock.invocationCallOrder[0]).toBeLessThan(interceptor2.mock.invocationCallOrder[0]);
    });

    it("then only the last interceptor's result is returned", async () => {
      axios.interceptors.response.use(() => 'response 1');
      axios.interceptors.response.use(() => 'response 2');

      const response = await fireRequest();
      expect(response).toBe('response 2');
    });

    it("then every interceptor receives the result of its predecessor", async () => {
      axios.interceptors.response.use(() => 'response 1');
      axios.interceptors.response.use((response) => [response, 'response 2']);

      const response = await fireRequest();
      expect(response).toEqual(['response 1', 'response 2']);
    });

    describe('and when the fulfillment interceptor throws', () => {
      const fireRequestCatch = async () => {
        const responsePromise = axios('/foo').catch(() => {});
        const request = await waitForRequest();

        request.respondWith({
          status: 200,
          responseText: 'OK',
        });

        await responsePromise;
      };

      it('then the following fulfillment interceptor is not called', async () => {
        axios.interceptors.response.use(() => {
          throw new Error('throwing interceptor');
        });

        const interceptor2 = vi.fn((response) => response);
        axios.interceptors.response.use(interceptor2);

        await fireRequestCatch();
        expect(interceptor2).not.toHaveBeenCalled();
      });

      it('then the following rejection interceptor is called', async () => {
        axios.interceptors.response.use(() => {
          throw new Error('throwing interceptor');
        });

        const rejectIntercept = vi.fn((error) => Promise.reject(error));
        axios.interceptors.response.use(() => {}, rejectIntercept);

        await fireRequestCatch();
        expect(rejectIntercept).toHaveBeenCalled();
      });

      it('once caught, another following fulfillment interceptor is called again', async () => {
        axios.interceptors.response.use(() => {
          throw new Error('throwing interceptor');
        });

        axios.interceptors.response.use(
          () => {},
          () => 'recovered'
        );

        const interceptor3 = vi.fn((response) => response);
        axios.interceptors.response.use(interceptor3);

        await fireRequestCatch();
        expect(interceptor3).toHaveBeenCalled();
      });
    });
  });

  it('should allow removing interceptors', async () => {
    axios.interceptors.response.use((data) => {
      data.data = `${data.data}1`;
      return data;
    });
    const intercept = axios.interceptors.response.use((data) => {
      data.data = `${data.data}2`;
      return data;
    });
    axios.interceptors.response.use((data) => {
      data.data = `${data.data}3`;
      return data;
    });

    axios.interceptors.response.eject(intercept);

    const responsePromise = axios('/foo');
    const request = await waitForRequest();

    request.respondWith({
      status: 200,
      responseText: 'OK',
    });

    const response = await responsePromise;
    expect(response.data).toBe('OK13');
  });

  it('should remove async interceptor before making request and execute synchronously', async () => {
    let asyncFlag = false;

    const asyncIntercept = axios.interceptors.request.use(
      (config) => {
        config.headers.async = 'async it!';
        return config;
      },
      null,
      { synchronous: false }
    );

    axios.interceptors.request.use(
      (config) => {
        config.headers.sync = 'hello world';
        expect(asyncFlag).toBe(false);
        return config;
      },
      null,
      { synchronous: true }
    );

    axios.interceptors.request.eject(asyncIntercept);

    const responsePromise = axios('/foo');
    asyncFlag = true;

    const request = await waitForRequest();
    expect(request.requestHeaders.async).toBeUndefined();
    expect(request.requestHeaders.sync).toBe('hello world');
    request.respondWith();
    await responsePromise;
  });

  it('should execute interceptors before transformers', async () => {
    axios.interceptors.request.use((config) => {
      config.data.baz = 'qux';
      return config;
    });

    const responsePromise = axios.post('/foo', {
      foo: 'bar',
    });

    const request = await waitForRequest();
    expect(request.params).toEqual('{"foo":"bar","baz":"qux"}');
    request.respondWith();
    await responsePromise;
  });

  it('should modify base URL in request interceptor', async () => {
    const instance = axios.create({
      baseURL: 'http://test.com/',
    });

    instance.interceptors.request.use((config) => {
      config.baseURL = 'http://rebase.com/';
      return config;
    });

    const responsePromise = instance.get('/foo');
    const request = await waitForRequest();

    expect(request.url).toBe('http://rebase.com/foo');
    request.respondWith();
    await responsePromise;
  });

  it('should clear all request interceptors', () => {
    const instance = axios.create({
      baseURL: 'http://test.com/',
    });

    instance.interceptors.request.use((config) => config);
    instance.interceptors.request.clear();

    expect(instance.interceptors.request.handlers.length).toBe(0);
  });

  it('should clear all response interceptors', () => {
    const instance = axios.create({
      baseURL: 'http://test.com/',
    });

    instance.interceptors.response.use((config) => config);
    instance.interceptors.response.clear();

    expect(instance.interceptors.response.handlers.length).toBe(0);
  });
});
