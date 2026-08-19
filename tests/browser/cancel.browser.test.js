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
  });
});
