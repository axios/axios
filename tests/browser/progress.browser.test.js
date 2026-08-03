import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import axios from '../../index.js';

// Real EventTarget + ProgressEvent dispatches so events keep genuine browser
// semantics: `target` survives the dispatch, `currentTarget` does not.
class ProgressEventTarget extends EventTarget {
  constructor() {
    super();
    this._listenerCounts = {};
  }

  addEventListener(type, listener, options) {
    this._listenerCounts[type] = (this._listenerCounts[type] || 0) + 1;
    super.addEventListener(type, listener, options);
  }
}

class MockXMLHttpRequest extends ProgressEventTarget {
  constructor() {
    super();
    this.requestHeaders = {};
    this.responseHeaders = {};
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.timeout = 0;
    this.withCredentials = false;
    this.onreadystatechange = null;
    this.onloadend = null;
    this.onabort = null;
    this.onerror = null;
    this.ontimeout = null;
    this.upload = new ProgressEventTarget();
    // like a real XHR, invoke the onloadend property while loadend dispatches
    this.addEventListener('loadend', (event) => {
      this.onloadend && this.onloadend(event);
    });
  }

  open(method, url, async = true) {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(key, value) {
    this.requestHeaders[key] = value;
  }

  getAllResponseHeaders() {
    return Object.entries(this.responseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  send(data) {
    this.params = data;
    this.readyState = 1;
    requests.push(this);
  }

  getListenerCount(type, target = 'request') {
    const eventTarget = target === 'upload' ? this.upload : this;
    return eventTarget._listenerCounts[type] || 0;
  }

  emit(type, target = 'request', init = {}) {
    const eventTarget = target === 'upload' ? this.upload : this;
    eventTarget.dispatchEvent(new ProgressEvent(type, init));
  }

  respondWith({
    status = 200,
    statusText = 'OK',
    responseText = '',
    response = null,
    headers = {},
  } = {}) {
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
    this.response = response;
    this.responseHeaders = headers;
    this.readyState = 4;

    this.emit('progress', 'request', {
      loaded: responseText.length,
      total: responseText.length,
      lengthComputable: true,
    });

    queueMicrotask(() => {
      if (this.onloadend) {
        this.emit('loadend', 'request', {
          loaded: this.responseText.length,
          total: this.responseText.length,
          lengthComputable: true,
        });
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

describe('progress (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    vi.restoreAllMocks();
  });

  it('should add a download progress handler', async () => {
    const progressSpy = vi.fn();
    const responsePromise = axios('/foo', { onDownloadProgress: progressSpy });
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });
    await responsePromise;

    expect(progressSpy).toHaveBeenCalled();
  });

  it('should add an upload progress handler', async () => {
    const progressSpy = vi.fn();
    const responsePromise = axios('/foo', { onUploadProgress: progressSpy });
    const request = getLastRequest();

    expect(request.getListenerCount('progress', 'upload')).toBe(1);

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });
    await responsePromise;
  });

  it('should add both upload and download progress handlers', async () => {
    const downloadProgressSpy = vi.fn();
    const uploadProgressSpy = vi.fn();
    const responsePromise = axios('/foo', {
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy,
    });
    const request = getLastRequest();

    expect(downloadProgressSpy).not.toHaveBeenCalled();
    expect(request.getListenerCount('progress', 'request')).toBe(1);
    expect(request.getListenerCount('progress', 'upload')).toBe(1);

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });
    await responsePromise;

    expect(downloadProgressSpy).toHaveBeenCalled();
  });

  it('should add a download progress handler from instance config', async () => {
    const progressSpy = vi.fn();
    const instance = axios.create({
      onDownloadProgress: progressSpy,
    });

    const responsePromise = instance.get('/foo');
    const request = getLastRequest();

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });
    await responsePromise;

    expect(progressSpy).toHaveBeenCalled();
  });

  it('should add an upload progress handler from instance config', async () => {
    const progressSpy = vi.fn();
    const instance = axios.create({
      onUploadProgress: progressSpy,
    });

    const responsePromise = instance.get('/foo');
    const request = getLastRequest();

    expect(request.getListenerCount('progress', 'upload')).toBe(1);

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });
    await responsePromise;
  });

  it('should add upload and download progress handlers from instance config', async () => {
    const downloadProgressSpy = vi.fn();
    const uploadProgressSpy = vi.fn();
    const instance = axios.create({
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy,
    });

    const responsePromise = instance.get('/foo');
    const request = getLastRequest();

    expect(downloadProgressSpy).not.toHaveBeenCalled();
    expect(request.getListenerCount('progress', 'request')).toBe(1);
    expect(request.getListenerCount('progress', 'upload')).toBe(1);

    request.respondWith({
      status: 200,
      responseText: '{"foo": "bar"}',
    });
    await responsePromise;

    expect(downloadProgressSpy).toHaveBeenCalled();
  });

  it('should deliver the full streamed payload to a listener reading from the live event target', async () => {
    let received = '';
    let lastLength = 0;
    const responsePromise = axios('/foo', {
      onDownloadProgress: ({ event }) => {
        const xhr = event && event.currentTarget;
        if (!xhr || typeof xhr.responseText !== 'string') {
          return;
        }
        received += xhr.responseText.slice(lastLength);
        lastLength = xhr.responseText.length;
      },
    });
    const request = getLastRequest();

    request.responseText = 'AAAA';
    request.emit('progress', 'request', { loaded: 4 });
    request.responseText += 'BBBB';
    request.emit('progress', 'request', { loaded: 8 });
    request.responseText += 'CCCC';
    request.emit('progress', 'request', { loaded: 12 });

    request.respondWith({ status: 200, responseText: request.responseText });
    await responsePromise;

    expect(received).toBe('AAAABBBBCCCC');
  });

  it('should always deliver a final download progress event with a live event target', async () => {
    const deliveries = [];
    const responsePromise = axios('/foo', {
      onDownloadProgress: ({ loaded, event }) => {
        deliveries.push({ loaded, liveTarget: !!(event && event.currentTarget) });
      },
    });
    const request = getLastRequest();

    request.responseText = 'AAAA';
    request.emit('progress', 'request', { loaded: 4 });
    request.responseText += 'BBBB';
    request.emit('progress', 'request', { loaded: 8 });

    request.respondWith({ status: 200, responseText: request.responseText });
    await responsePromise;

    expect(deliveries.at(-1)).toEqual({ loaded: 8, liveTarget: true });
  });

  it('should always deliver a final upload progress event with a live event target', async () => {
    const deliveries = [];
    const responsePromise = axios.post('/foo', 'payload', {
      onUploadProgress: ({ loaded, event }) => {
        deliveries.push({ loaded, liveTarget: !!(event && event.currentTarget) });
      },
    });
    const request = getLastRequest();

    request.emit('progress', 'upload', { loaded: 3, total: 7, lengthComputable: true });
    request.emit('progress', 'upload', { loaded: 5, total: 7, lengthComputable: true });
    request.emit('loadend', 'upload', { loaded: 7, total: 7, lengthComputable: true });

    request.respondWith({ status: 200, responseText: 'ok' });
    await responsePromise;

    expect(deliveries.at(-1)).toEqual({ loaded: 7, liveTarget: true });
  });

  it('should settle the request when the final progress listener throws', async () => {
    // fake timers keep the rethrown listener error parked so it cannot fail the test run
    vi.useFakeTimers();
    try {
      let finalDeliveries = 0;
      const responsePromise = axios('/foo', {
        onDownloadProgress: ({ event }) => {
          if (event && event.type === 'loadend') {
            finalDeliveries += 1;
            throw new Error('listener failure');
          }
        },
      });
      const request = getLastRequest();

      request.responseText = 'AAAA';
      request.emit('progress', 'request', { loaded: 4 });
      request.respondWith({ status: 200, responseText: request.responseText });

      const response = await responsePromise;

      expect(finalDeliveries).toBe(1);
      expect(response.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should keep the request reachable via event.target on throttle-deferred deliveries', async () => {
    vi.useFakeTimers();
    try {
      const deliveries = [];
      const responsePromise = axios('/foo', {
        onDownloadProgress: ({ event }) => {
          deliveries.push(event && event.target);
        },
      });
      const request = getLastRequest();

      request.responseText = 'AAAA';
      request.emit('progress', 'request', { loaded: 4 });
      request.responseText += 'BBBB';
      request.emit('progress', 'request', { loaded: 8 });

      // step past the throttle window so the second event arrives via the timer
      await vi.advanceTimersByTimeAsync(400);

      request.respondWith({ status: 200, responseText: request.responseText });
      await responsePromise;

      expect(deliveries.length).toBeGreaterThanOrEqual(2);
      expect(deliveries.every((target) => target === request)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
