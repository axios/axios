import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The xhr adapter fixes `isXHRAdapterSupported` and `platform.origin` at module load,
// so each case stubs the globals first and imports axios into a fresh module registry.
// The stub fires only readystatechange and loadend with status 0, which is both the
// Firefox 152 navigation-cancel shape (https://bugzilla.mozilla.org/show_bug.cgi?id=1505389)
// and the shape of a successful file: read in an environment without responseURL.

// Use native dispatch semantics, including removal during event delivery.
const $listeners = Symbol('listeners');

class StubEventTarget extends EventTarget {
  constructor() {
    super();
    this[$listeners] = {};
  }

  addEventListener(type, fn) {
    (this[$listeners][type] || (this[$listeners][type] = new Set())).add(fn);
    super.addEventListener(type, fn);
  }

  removeEventListener(type, fn) {
    this[$listeners][type] && this[$listeners][type].delete(fn);
    super.removeEventListener(type, fn);
  }

  listenerCount(type) {
    return this[$listeners][type] ? this[$listeners][type].size : 0;
  }

  dispatch(type, init) {
    this.dispatchEvent(Object.assign(new Event(type), init));
  }
}

let lastInstance;

class StubXMLHttpRequest extends StubEventTarget {
  constructor() {
    super();
    lastInstance = this;
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = '';
    this.timeout = 0;
    this.onloadend = null;
    this.onabort = null;
    this.onerror = null;
    this.ontimeout = null;
    this.onreadystatechange = null;
    this.upload = new StubEventTarget();
    this.aborted = false;
  }

  open() {}

  setRequestHeader() {}

  getAllResponseHeaders() {
    return '';
  }

  abort() {
    this.aborted = true;
    if (this.readyState > 0 && this.readyState < 4) {
      this.readyState = 4;
      this.status = 0;
      this.onabort && this.onabort();
      this.onloadend && this.onloadend();
    }
    this.readyState = 0;
  }

  // Complete explicitly so tests can queue progress before settlement.
  respondWith({ status = 200, responseText = '' } = {}) {
    this.readyState = 4;
    this.status = status;
    this.responseText = responseText;
    this.response = responseText;
    this.onreadystatechange && this.onreadystatechange();
    this.onloadend && this.onloadend();
  }

  send() {
    setTimeout(() => {
      this.readyState = 4;
      this.onreadystatechange && this.onreadystatechange();
      this.onloadend && this.onloadend();
    });
  }
}

async function importAxiosForPage(originHref) {
  vi.resetModules();
  vi.stubGlobal('window', { location: { href: originHref } });
  vi.stubGlobal('document', { cookie: '' });
  vi.stubGlobal('XMLHttpRequest', StubXMLHttpRequest);
  const { default: axios } = await import('../../../index.js');
  return axios;
}

describe('xhr adapter status 0 handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('should resolve a relative file: read when responseURL is unavailable', async () => {
    const axios = await importAxiosForPage('file:///app/index.html');
    const response = await axios.get('data.json', { adapter: 'xhr' });
    expect(response.status).toBe(0);
  });

  it('should reject with ECONNABORTED for a relative request from an http page', async () => {
    const axios = await importAxiosForPage('http://localhost/index.html');
    const reason = await axios.get('data.json', { adapter: 'xhr' }).catch((error) => error);
    expect(reason).toBeInstanceOf(axios.AxiosError);
    expect(reason.code).toBe(axios.AxiosError.ECONNABORTED);
    expect(reason.message).toBe('Request aborted');
  });

  it('should reject before validateStatus can accept a status 0 response', async () => {
    const axios = await importAxiosForPage('http://localhost/index.html');
    const validateStatus = vi.fn(() => true);
    const reason = await axios
      .get('data.json', { adapter: 'xhr', validateStatus })
      .catch((error) => error);
    expect(reason).toBeInstanceOf(axios.AxiosError);
    expect(reason.code).toBe(axios.AxiosError.ECONNABORTED);
    expect(validateStatus).not.toHaveBeenCalled();
  });

  it('should resolve an absolute file: read from an http page when responseURL is unavailable', async () => {
    const axios = await importAxiosForPage('http://localhost/index.html');
    const response = await axios.get('file:///app/data.json', { adapter: 'xhr' });
    expect(response.status).toBe(0);
  });

  it('should reject with ECONNABORTED for an absolute http request from a file: page', async () => {
    const axios = await importAxiosForPage('file:///app/index.html');
    const reason = await axios
      .get('https://api.example.com/things', { adapter: 'xhr' })
      .catch((error) => error);
    expect(reason).toBeInstanceOf(axios.AxiosError);
    expect(reason.code).toBe(axios.AxiosError.ECONNABORTED);
  });

  it.each([
    ['an ASCII space', ' https://api.example.com/things'],
    ['a C0 control', '\u0000https://api.example.com/things'],
  ])(
    'should reject an absolute http request from a file: page when prefixed by %s',
    async (description, url) => {
      const axios = await importAxiosForPage('file:///app/index.html');
      const reason = await axios.get(url, { adapter: 'xhr' }).catch((error) => error);
      expect(reason).toBeInstanceOf(axios.AxiosError);
      expect(reason.code).toBe(axios.AxiosError.ECONNABORTED);
    }
  );
});

describe('xhr adapter progress listener cleanup', () => {
  let axios, controller, source, subscribe, unsubscribe, addListener, removeListener;

  beforeEach(async () => {
    vi.useFakeTimers();
    axios = await importAxiosForPage('http://localhost/index.html');
    // Completion is controlled by each test, with no stray automatic loadend timer.
    vi.spyOn(StubXMLHttpRequest.prototype, 'send').mockImplementation(function () {
      this.readyState = 2;
    });
    controller = new AbortController();
    source = axios.CancelToken.source();
    subscribe = vi.spyOn(source.token, 'subscribe');
    unsubscribe = vi.spyOn(source.token, 'unsubscribe');
    addListener = vi.spyOn(controller.signal, 'addEventListener');
    removeListener = vi.spyOn(controller.signal, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.useRealTimers();
  });

  function start(config = {}) {
    const promise = axios.post('data.json', 'body', {
      adapter: 'xhr',
      signal: controller.signal,
      cancelToken: source.token,
      onDownloadProgress: () => {},
      onUploadProgress: () => {},
      ...config,
    });
    return { promise, request: lastInstance };
  }

  function expectCleanup(request) {
    expect(request.listenerCount('progress')).toBe(0);
    if (request.upload) {
      expect(request.upload.listenerCount('progress')).toBe(0);
      expect(request.upload.listenerCount('loadend')).toBe(0);
    }
    expect(subscribe).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledWith(subscribe.mock.calls[0][0]);
    expect(addListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('abort', addListener.mock.calls[0][1]);
  }

  function queueProgress(target) {
    target.dispatch('progress', { loaded: 10, total: 100, lengthComputable: true });
    target.dispatch('progress', { loaded: 20, total: 100, lengthComputable: true });
  }

  it.each([
    ['success', undefined],
    ['HTTP error', 'ERR_BAD_RESPONSE'],
    ['network error', 'ERR_NETWORK'],
    ['timeout', 'ECONNABORTED'],
    ['browser abort', 'ECONNABORTED'],
    ['signal', 'ERR_CANCELED'],
    ['cancelToken', 'ERR_CANCELED'],
  ])('flushes progress and removes all subscriptions after %s', async (kind, code) => {
    const upload = vi.fn();
    const download = vi.fn();
    const { promise, request } = start({ onUploadProgress: upload, onDownloadProgress: download });

    expect(request.listenerCount('progress')).toBe(1);
    expect(request.upload.listenerCount('progress')).toBe(1);
    expect(request.upload.listenerCount('loadend')).toBe(1);
    queueProgress(request);
    queueProgress(request.upload);
    expect(upload).toHaveBeenCalledOnce();
    expect(download).toHaveBeenCalledOnce();

    switch (kind) {
      case 'success':
        request.respondWith({ responseText: 'ok' });
        break;
      case 'HTTP error':
        request.respondWith({ status: 500 });
        break;
      case 'network error':
        request.onerror(new Event('error'));
        break;
      case 'timeout':
        request.ontimeout();
        break;
      case 'browser abort':
        request.abort();
        break;
      case 'signal':
        controller.abort();
        break;
      case 'cancelToken':
        source.cancel();
        break;
    }

    if (code) {
      await expect(promise).rejects.toMatchObject({ code });
    } else {
      expect((await promise).status).toBe(200);
    }
    expect(upload).toHaveBeenCalledTimes(2);
    expect(download).toHaveBeenCalledTimes(2);
    expect(upload.mock.lastCall[0].loaded).toBe(20);
    expect(download.mock.lastCall[0].loaded).toBe(20);
    expectCleanup(request);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['upload', 'download'])(
    'continues cleanup when a final %s progress callback throws',
    async (kind) => {
      const listener = vi.fn(() => {
        if (listener.mock.calls.length === 2) throw new Error('listener failure');
      });
      const otherListener = vi.fn();
      const { promise, request } = start({
        onUploadProgress: kind === 'upload' ? listener : otherListener,
        onDownloadProgress: kind === 'download' ? listener : otherListener,
      });
      queueProgress(request.upload);
      queueProgress(request);

      // Error completion flushes both directions from done(), including download.
      expect(() => request.onerror(new Event('error'))).not.toThrow();
      await expect(promise).rejects.toMatchObject({ code: 'ERR_NETWORK' });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(otherListener).toHaveBeenCalledTimes(2);
      expectCleanup(request);
      await expect(vi.runAllTimersAsync()).rejects.toThrow('listener failure');
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('keeps a successful response when a final upload callback throws', async () => {
    const listener = vi.fn(() => {
      if (listener.mock.calls.length === 2) throw new Error('listener failure');
    });
    const { promise, request } = start({ onUploadProgress: listener });
    queueProgress(request.upload);
    request.respondWith({ responseText: 'ok' });
    expect((await promise).status).toBe(200);
    expectCleanup(request);
    await expect(vi.runAllTimersAsync()).rejects.toThrow('listener failure');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('removes listeners when a final upload callback cancels synchronously', async () => {
    const listener = vi.fn(() => {
      if (listener.mock.calls.length === 2) controller.abort();
    });
    const { promise, request } = start({ onUploadProgress: listener });
    queueProgress(request.upload);
    expect(listener).toHaveBeenCalledOnce();

    expect(() => request.respondWith({ responseText: 'ok' })).not.toThrow();

    // The adapter has resolved, but dispatchRequest rechecks cancellation before
    // delivering that response through the public Axios promise.
    await expect(promise).rejects.toBeInstanceOf(axios.CanceledError);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(request.aborted).toBe(true);
    expectCleanup(request);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up cancellation without registering progress listeners when callbacks are absent', async () => {
    const { promise, request } = start({
      onUploadProgress: undefined,
      onDownloadProgress: undefined,
    });
    expect(request.listenerCount('progress')).toBe(0);
    expect(request.upload.listenerCount('progress')).toBe(0);
    expect(request.upload.listenerCount('loadend')).toBe(0);
    request.respondWith();
    await promise;
    expectCleanup(request);
  });

  it('supports XHR implementations without upload events', async () => {
    vi.stubGlobal(
      'XMLHttpRequest',
      class extends StubXMLHttpRequest {
        constructor() {
          super();
          delete this.upload;
        }
      }
    );
    const upload = vi.fn();
    const { promise, request } = start({ onUploadProgress: upload });
    request.respondWith();
    await promise;
    expect(upload).not.toHaveBeenCalled();
    expectCleanup(request);
  });

  it.each(['success', 'cancellation', 'timeout'])(
    'preserves asynchronous XSRF timer and listener cleanup after %s',
    async (kind) => {
      let finishRead;
      window.cookieStore = {
        get: () =>
          new Promise((resolve) => {
            finishRead = resolve;
          }),
      };
      const { promise, request } = start({ timeout: 50 });
      const settled = promise.catch((error) => error);
      expect(vi.getTimerCount()).toBe(1);
      expect(request.send).not.toHaveBeenCalled();

      if (kind === 'success') {
        finishRead(null);
        await vi.advanceTimersByTimeAsync(0);
        expect(request.send).toHaveBeenCalledOnce();
        request.respondWith();
        expect((await settled).status).toBe(200);
      } else {
        if (kind === 'cancellation') controller.abort();
        else await vi.advanceTimersByTimeAsync(50);
        expect((await settled).code).toBe(
          kind === 'cancellation' ? 'ERR_CANCELED' : 'ECONNABORTED'
        );
        finishRead(null);
        await vi.advanceTimersByTimeAsync(0);
        expect(request.send).not.toHaveBeenCalled();
      }
      expectCleanup(request);
      expect(vi.getTimerCount()).toBe(0);
    }
  );
});
