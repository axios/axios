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
    this.timeout = 0;
    this.withCredentials = false;
    this.onreadystatechange = null;
    this.onloadend = null;
    this.onabort = null;
    this.onerror = null;
    this.ontimeout = null;
    this._listeners = {};
    this._uploadListeners = {};
    this.upload = {
      addEventListener: (type, listener) => {
        this._uploadListeners[type] ||= [];
        this._uploadListeners[type].push(listener);
      },
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

  addEventListener(type, listener) {
    this._listeners[type] ||= [];
    this._listeners[type].push(listener);
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
    const listeners = target === 'upload' ? this._uploadListeners : this._listeners;
    return listeners[type]?.length || 0;
  }

  emit(type, target = 'request', event = {}) {
    const listeners = target === 'upload' ? this._uploadListeners : this._listeners;
    (listeners[type] || []).forEach((listener) => listener(event));
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
});
