import { afterEach, describe, expect, it, vi } from 'vitest';

// The xhr adapter fixes `isXHRAdapterSupported` and `platform.origin` at module load,
// so each case stubs the globals first and imports axios into a fresh module registry.
// The stub fires only readystatechange and loadend with status 0, which is both the
// Firefox 152 navigation-cancel shape (https://bugzilla.mozilla.org/show_bug.cgi?id=1505389)
// and the shape of a successful file: read in an environment without responseURL.

// Minimal EventTarget-like helper so the stub can model addEventListener/
// removeEventListener for progress tracking, which the xhr adapter relies on
// and which the previous stub didn't support at all.
class StubEventTarget {
  constructor() {
    this._listeners = {};
  }

  addEventListener(type, fn) {
    (this._listeners[type] || (this._listeners[type] = new Set())).add(fn);
  }

  removeEventListener(type, fn) {
    this._listeners[type] && this._listeners[type].delete(fn);
  }

  listenerCount(type) {
    return this._listeners[type] ? this._listeners[type].size : 0;
  }

  dispatch(type, event) {
    const listeners = this._listeners[type];
    if (!listeners) return;
    // snapshot: a listener may remove another listener (or itself) mid-dispatch
    [...listeners].forEach((fn) => fn(event));
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
  }

  // Test-only helper: fires 'progress' then completes via onloadend,
  // mirroring a real XHR's event order for a successful response.
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
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.useRealTimers();
  });

  it('should remove progress and upload listeners once the request completes', async () => {
    const axios = await importAxiosForPage('http://localhost/index.html');
    const responsePromise = axios.get('data.json', {
      adapter: 'xhr',
      onDownloadProgress: () => {},
      onUploadProgress: () => {},
    });
    const request = lastInstance;

    // listeners must be attached while the request is in flight
    expect(request.listenerCount('progress')).toBe(1);
    expect(request.upload.listenerCount('progress')).toBe(1);
    expect(request.upload.listenerCount('loadend')).toBe(1);

    request.respondWith({ status: 200, responseText: 'ok' });
    await responsePromise;

    expect(request.listenerCount('progress')).toBe(0);
    expect(request.upload.listenerCount('progress')).toBe(0);
    expect(request.upload.listenerCount('loadend')).toBe(0);
  });

  // flushDownload() is already invoked earlier inside onloadend's own
  // try/catch (see the "final progress callback throws" handling above it),
  // so it can't demonstrate this bug. flushUpload() is only ever called from
  // inside done() itself, which is the actual path that needed guarding —
  // these two tests drive upload progress specifically for that reason.

  it('should still remove listeners when a queued final upload progress callback throws', async () => {
    // fake timers park the intentionally-rethrown listener error so it can't fail the run
    vi.useFakeTimers();
    let calls = 0;
    const axios = await importAxiosForPage('http://localhost/index.html');
    const responsePromise = axios.post('data.json', 'body', {
      adapter: 'xhr',
      onUploadProgress: () => {
        calls += 1;
        // second delivery is the one flushed from inside done(); make that one throw
        if (calls === 2) throw new Error('listener failure');
      },
    });
    const request = lastInstance;

    // first event: throttle has no prior timestamp, invokes immediately (calls -> 1)
    request.upload.dispatch('progress', { loaded: 10, total: 100, lengthComputable: true });
    // second event lands inside the throttle window, so it's queued (lastArgs)
    // rather than invoked immediately — this is what done() will flush
    request.upload.dispatch('progress', { loaded: 20, total: 100, lengthComputable: true });
    expect(calls).toBe(1);

    // completion reaches done() via settle()'s _resolve callback, which calls
    // flushUpload() first — that's where the queued callback above throws
    request.respondWith({ status: 200, responseText: 'ok' });

    const response = await responsePromise;

    expect(calls).toBe(2);
    expect(response.status).toBe(200);
    // cleanup (removeEventListener + signal/cancelToken teardown) must still
    // have run after the throw, not been skipped by it
    expect(request.upload.listenerCount('progress')).toBe(0);
    expect(request.upload.listenerCount('loadend')).toBe(0);

    // drain the asynchronously-rethrown error so it doesn't leak into another test
    await expect(vi.runAllTimersAsync()).rejects.toThrow('listener failure');
  });

  it('should not throw when a queued final upload progress callback cancels the request synchronously', async () => {
    const axios = await importAxiosForPage('http://localhost/index.html');
    const controller = new AbortController();
    let calls = 0;
    const responsePromise = axios.post('data.json', 'body', {
      adapter: 'xhr',
      signal: controller.signal,
      onUploadProgress: () => {
        calls += 1;
        // The first delivery invokes immediately (no throttle timestamp yet)
        // and must NOT abort, or this never reaches the queued/reentrant path
        // this test exists to cover. Only the second (queued, flushed-by-
        // done()) delivery aborts.
        if (calls === 2) controller.abort();
      },
    });
    const request = lastInstance;

    request.upload.dispatch('progress', { loaded: 10, total: 100, lengthComputable: true });
    request.upload.dispatch('progress', { loaded: 20, total: 100, lengthComputable: true });
    expect(calls).toBe(1); // confirms the second delivery really is queued, not immediate

    // completion reaches done() via settle()'s _resolve callback, which calls
    // flushUpload() first. That flush synchronously cancels the request
    // (nulling the shared `request` variable) *before* done() reaches its own
    // listener-removal lines — this must not throw a TypeError.
    expect(() => request.respondWith({ status: 200, responseText: 'ok' })).not.toThrow();

    const reason = await responsePromise.catch((error) => error);
    expect(reason).toBeInstanceOf(axios.CanceledError);
  });
});
