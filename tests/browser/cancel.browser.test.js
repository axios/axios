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
    this.onabort = null;
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

  abort() {
    this.statusText = 'abort';
    if (this.onabort) {
      this.onabort();
    }
  }
}

let requests = [];
let OriginalXMLHttpRequest;

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

describe('cancel (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    vi.restoreAllMocks();
  });

  describe('when called before sending request', () => {
    it('rejects Promise with a CanceledError object', async () => {
      const source = axios.CancelToken.source();
      source.cancel('Operation has been canceled.');

      const error = await axios
        .get('/foo', {
          cancelToken: source.token,
        })
        .catch((thrown) => thrown);

      expect(axios.isCancel(error)).toBe(true);
      expect(error.message).toBe('Operation has been canceled.');
      expect(requests).toHaveLength(0);
    });
  });

  describe('when called after request has been sent', () => {
    it('rejects Promise with a CanceledError object', async () => {
      const source = axios.CancelToken.source();
      const promise = axios.get('/foo/bar', {
        cancelToken: source.token,
      });

      const request = await waitForRequest();

      // Call cancel() after the request has been sent, but before response is received.
      source.cancel('Operation has been canceled.');
      request.respondWith({
        status: 200,
        responseText: 'OK',
      });

      const error = await promise.catch((thrown) => thrown);

      expect(axios.isCancel(error)).toBe(true);
      expect(error.message).toBe('Operation has been canceled.');
    });

    it('calls abort on request object', async () => {
      const source = axios.CancelToken.source();
      const promise = axios.get('/foo/bar', {
        cancelToken: source.token,
      });

      const request = await waitForRequest();

      // Call cancel() after the request has been sent, but before response is received.
      source.cancel();

      await promise.catch(() => undefined);

      expect(request.statusText).toBe('abort');
    });
  });

  it('supports cancellation using AbortController signal', async () => {
    const controller = new AbortController();
    const promise = axios.get('/foo/bar', {
      signal: controller.signal,
    });

    const request = await waitForRequest();

    // Call abort() after the request has been sent, but before response is received.
    controller.abort();
    setTimeout(() => {
      request.respondWith({
        status: 200,
        responseText: 'OK',
      });
    }, 0);

    const error = await promise.catch((thrown) => thrown);
    expect(axios.isCancel(error)).toBe(true);
  });

  it('preserves the AbortSignal reason on the rejected CanceledError', async () => {
    const controller = new AbortController();
    const promise = axios.get('/foo/bar', {
      signal: controller.signal,
    });

    const request = await waitForRequest();

    controller.abort('TimeoutError');
    setTimeout(() => {
      request.respondWith({ status: 200, responseText: 'OK' });
    }, 0);

    const error = await promise.catch((thrown) => thrown);
    expect(axios.isCancel(error)).toBe(true);
    expect(error.message).toBe('TimeoutError');
  });

  it('preserves a CanceledError abort reason instance', async () => {
    const controller = new AbortController();
    const customReason = new axios.CanceledError('custom cancel reason');
    const promise = axios.get('/foo/bar', {
      signal: controller.signal,
    });

    const request = await waitForRequest();

    controller.abort(customReason);
    setTimeout(() => {
      request.respondWith({ status: 200, responseText: 'OK' });
    }, 0);

    const error = await promise.catch((thrown) => thrown);
    expect(error).toBe(customReason);
  });

  it('rejects immediately when the signal is already aborted with a reason', async () => {
    const controller = new AbortController();
    controller.abort('TimeoutError');

    const error = await axios
      .get('/foo/bar', { signal: controller.signal })
      .catch((thrown) => thrown);

    expect(axios.isCancel(error)).toBe(true);
    expect(error.message).toBe('TimeoutError');
    expect(requests).toHaveLength(0);
  });

  it.each([
    ['Symbol', Symbol('stop'), 'Symbol(stop)'],
    ['BigInt', BigInt(1), '1'],
    ['zero', 0, '0'],
    ['false', false, 'false'],
    ['empty string', '', ''],
    ['null', null, 'canceled'],
    ['object', { operation: 'stop' }, 'canceled'],
    ['Error', new Error('stop'), 'stop'],
    ['AxiosError', new axios.AxiosError('stop', 'ERR_BAD_REQUEST'), 'stop'],
    [
      'throwing message getter',
      {
        get message() {
          throw new Error('unreadable');
        },
      },
      'canceled',
    ],
  ])('cancels active XHR with %s and removes its listener', async (label, reason, message) => {
    const controller = new AbortController();
    const add = vi.spyOn(controller.signal, 'addEventListener');
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const result = axios
      .get('/foo/bar', { adapter: 'xhr', signal: controller.signal })
      .catch((error) => error);
    const request = await waitForRequest();

    controller.abort(reason);
    // Assert transport teardown before awaiting settlement: a regression must
    // fail here instead of passing after a mocked response completes the request.
    expect(request.statusText).toBe('abort');
    const error = await result;
    expect(axios.isCancel(error)).toBe(true);
    expect(error.code).toBe('ERR_CANCELED');
    expect(error.message).toBe(message);
    expect(error.cause).toBe(reason);
    expect(error.request).toBe(request);
    expect(() => JSON.stringify(error.toJSON())).not.toThrow();
    const listener = add.mock.calls.find((call) => call[0] === 'abort')[1];
    expect(remove).toHaveBeenCalledWith('abort', listener);
  });

  it('rejects a pre-aborted Symbol without creating an XHR', async () => {
    const controller = new AbortController();
    const reason = Symbol('stop');
    controller.abort(reason);
    const error = await axios
      .get('/foo', { adapter: 'xhr', signal: controller.signal })
      .catch((error) => error);
    expect(error.code).toBe('ERR_CANCELED');
    expect(error.message).toBe('Symbol(stop)');
    expect(error.cause).toBe(reason);
    expect(requests).toHaveLength(0);
  });

  it('preserves the Symbol cause when Fetch rejects with a native abort error', async () => {
    const controller = new AbortController();
    const reason = Symbol('stop');
    let started;
    let fetchSignal;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    const result = axios
      .get('/foo', {
        adapter: 'fetch',
        signal: controller.signal,
        env: {
          fetch: (request) =>
            new Promise((resolve, reject) => {
              fetchSignal = request.signal;
              fetchSignal.addEventListener(
                'abort',
                () => {
                  reject(new DOMException('The operation was aborted', 'AbortError'));
                },
                { once: true }
              );
              started();
            }),
        },
      })
      .catch((error) => error);

    await ready;
    controller.abort(reason);
    expect(fetchSignal.aborted).toBe(true);
    const error = await result;
    expect(axios.isCancel(error)).toBe(true);
    expect(error.code).toBe('ERR_CANCELED');
    expect(error.message).toBe('Symbol(stop)');
    expect(error.cause).toBe(reason);
    expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
  });

  describe('listener cleanup on error paths', () => {
    for (const { label, trigger } of [
      { label: 'network error', trigger: (r) => r.onerror(new Error('Network Error')) },
      { label: 'timeout', trigger: (r) => r.ontimeout() },
      { label: 'browser abort', trigger: (r) => r.onabort() },
    ]) {
      it(`unsubscribes cancelToken listener after ${label}`, async () => {
        const source = axios.CancelToken.source();
        const promise = axios
          .get('/foo/bar', { cancelToken: source.token })
          .catch((thrown) => thrown);

        const request = await waitForRequest();
        trigger(request);
        await promise;

        expect(source.token._listeners || []).toEqual([]);
      });
    }

    it('removes AbortSignal listener after network error', async () => {
      const controller = new AbortController();
      let listenerCount = 0;
      const nativeAdd = controller.signal.addEventListener.bind(controller.signal);
      const nativeRemove = controller.signal.removeEventListener.bind(controller.signal);
      controller.signal.addEventListener = (type, fn, options) => {
        if (type === 'abort') listenerCount++;
        return nativeAdd(type, fn, options);
      };
      controller.signal.removeEventListener = (type, fn, options) => {
        if (type === 'abort') listenerCount--;
        return nativeRemove(type, fn, options);
      };

      const promise = axios
        .get('/foo/bar', { signal: controller.signal })
        .catch((thrown) => thrown);

      const request = await waitForRequest();
      request.onerror(new Error('Network Error'));
      await promise;

      expect(listenerCount).toBe(0);
    });

    it('removes AbortSignal listener after the request settles successfully', async () => {
      const controller = new AbortController();
      let listenerCount = 0;
      const nativeAdd = controller.signal.addEventListener.bind(controller.signal);
      const nativeRemove = controller.signal.removeEventListener.bind(controller.signal);
      controller.signal.addEventListener = (type, fn, options) => {
        if (type === 'abort') listenerCount++;
        return nativeAdd(type, fn, options);
      };
      controller.signal.removeEventListener = (type, fn, options) => {
        if (type === 'abort') listenerCount--;
        return nativeRemove(type, fn, options);
      };

      const promise = axios.get('/foo/bar', { signal: controller.signal });

      const request = await waitForRequest();
      request.respondWith({ status: 200, responseText: 'OK' });
      await promise;

      expect(listenerCount).toBe(0);
    });

    it('removes the exact AbortSignal listener that was registered', async () => {
      const controller = new AbortController();
      const registered = new Set();
      const nativeAdd = controller.signal.addEventListener.bind(controller.signal);
      const nativeRemove = controller.signal.removeEventListener.bind(controller.signal);
      controller.signal.addEventListener = (type, fn, options) => {
        if (type === 'abort') registered.add(fn);
        return nativeAdd(type, fn, options);
      };
      controller.signal.removeEventListener = (type, fn, options) => {
        if (type === 'abort' && registered.has(fn)) registered.delete(fn);
        return nativeRemove(type, fn, options);
      };

      const promise = axios.get('/foo/bar', { signal: controller.signal });

      const request = await waitForRequest();
      request.respondWith({ status: 200, responseText: 'OK' });
      await promise;

      expect(registered.size).toBe(0);
    });
  });
});
