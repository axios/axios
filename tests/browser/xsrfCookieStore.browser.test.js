import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../index.js';
import cookies from '../../lib/helpers/cookies.js';
import { nativeCookieStore } from '../setup/nativeCookieStore.js';

const NativeXMLHttpRequest = window.XMLHttpRequest;

let requests;
let completeRequests;
let controllers;

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
    this.status = 200;
    this.statusText = 'OK';
    this.responseText = '';
    this.onloadend = null;
    this.timeout = 0;
  }

  open() {}

  setRequestHeader(name, value) {
    this.requestHeaders[name] = this.requestHeaders[name]
      ? this.requestHeaders[name] + ', ' + value
      : value;
  }

  getAllResponseHeaders() {
    return '';
  }

  send() {
    requests.push(this);
    if (completeRequests) queueMicrotask(() => this.onloadend());
  }

  abort() {
    this.onabort && this.onabort();
  }
}

const startRequest = (config = {}) => {
  const controller = new AbortController();
  controllers.push(controller);
  const result = {};
  result.promise = axios
    .get('/cookie-store', {
      adapter: 'xhr',
      signal: controller.signal,
      ...config,
    })
    .then(
      (response) => {
        result.response = response;
      },
      (error) => {
        result.error = error;
      }
    );
  return { result, controller };
};

describe('XHR Cookie Store compatibility', () => {
  beforeEach(() => {
    requests = [];
    controllers = [];
    completeRequests = true;
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
  });

  afterEach(() => {
    controllers.forEach((controller) => controller.abort());
    document.cookie = 'XSRF-TOKEN=; max-age=0; path=/';
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    ['abc%2Fdef%3D', 'abc/def='],
    ['literal%252F', 'literal%2F'],
    ['a+b', 'a+b'],
    ['malformed%E0%A4%A', 'malformed%E0%A4%A'],
    ['', undefined],
  ])('preserves the existing header for cookie %s on every read path', async (stored, expected) => {
    document.cookie = `XSRF-TOKEN=${stored}; path=/`;
    for (const store of [
      undefined,
      { get: vi.fn().mockResolvedValue({ value: stored }) },
      { get: vi.fn().mockRejectedValue(new Error('unavailable')) },
    ]) {
      vi.stubGlobal('cookieStore', store);
      const response = await axios.get('/cookie-store', { adapter: 'xhr' });
      expect(response.request.requestHeaders['X-XSRF-TOKEN']).toBe(expected);
    }
  });

  it.runIf(nativeCookieStore).each(['abc%2Fdef%3D', 'literal%252F', 'a+b', 'malformed%'])(
    'round-trips a real browser cookie through Cookie Store: %s',
    async (stored) => {
      document.cookie = `XSRF-TOKEN=${stored}; path=/`;
      const expected = cookies.read('XSRF-TOKEN');
      const readSpy = vi.spyOn(cookies, 'read');
      vi.stubGlobal('cookieStore', nativeCookieStore);

      expect((await nativeCookieStore.get('XSRF-TOKEN')).value).toBe(stored);
      const response = await axios.get('/cookie-store', { adapter: 'xhr' });

      expect(response.request.requestHeaders['X-XSRF-TOKEN']).toBe(expected);
      expect(readSpy).not.toHaveBeenCalled();
    }
  );

  it.each([{ xsrfCookieName: null }, { xsrfHeaderName: null }, { withXSRFToken: false }])(
    'does not start a cookie read when XSRF is disabled: %j',
    async (config) => {
      const get = vi.fn().mockResolvedValue({ value: 'secret' });
      const readSpy = vi.spyOn(cookies, 'readAsync');
      vi.stubGlobal('cookieStore', { get });
      await axios.get('/cookie-store', { adapter: 'xhr', ...config });
      expect(get).not.toHaveBeenCalled();
      expect(readSpy).not.toHaveBeenCalled();
    }
  );

  it('does not fall back to a stale cookie when Cookie Store returns no match', async () => {
    document.cookie = 'XSRF-TOKEN=stale; path=/';
    vi.stubGlobal('cookieStore', { get: vi.fn().mockResolvedValue(null) });
    const readSpy = vi.spyOn(cookies, 'read');
    const response = await axios.get('/cookie-store', { adapter: 'xhr' });
    expect(response.request.requestHeaders['X-XSRF-TOKEN']).toBeUndefined();
    expect(readSpy).not.toHaveBeenCalled();
  });

  it.runIf(nativeCookieStore)(
    'sends a decoded token through native Cookie Store and native XHR',
    async () => {
      document.cookie = 'XSRF-TOKEN=abc%2Fdef%3D; path=/';
      vi.stubGlobal('cookieStore', nativeCookieStore);
      vi.stubGlobal('XMLHttpRequest', NativeXMLHttpRequest);
      const setHeader = vi.spyOn(NativeXMLHttpRequest.prototype, 'setRequestHeader');
      const response = await axios.get('/', { adapter: 'xhr', timeout: 5000 });
      expect(response.status).toBe(200);
      expect(setHeader).toHaveBeenCalledWith('X-XSRF-TOKEN', 'abc/def=');
    }
  );

  it('keeps Fetch on its existing synchronous cookie reader', async () => {
    document.cookie = 'XSRF-TOKEN=abc%2Fdef%3D; path=/';
    const get = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal('cookieStore', { get });
    const fetch = vi.fn(async (request) => new Response(request.headers.get('X-XSRF-TOKEN')));
    const response = await axios.get(window.location.href, { adapter: 'fetch', env: { fetch } });
    expect(response.data).toBe('abc/def=');
    expect(get).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, false],
    [false, false],
    ['false', false],
    [1, false],
    [{}, false],
    [true, true],
    [() => true, true],
    [() => false, false],
  ])('preserves strict cross-origin eligibility with Cookie Store: %s', async (flag, eligible) => {
    const get = vi.fn().mockResolvedValue({ value: 'secret' });
    vi.stubGlobal('cookieStore', { get });
    const response = await axios.get('https://other.example.invalid/', {
      adapter: 'xhr',
      withXSRFToken: flag,
    });
    expect(get).toHaveBeenCalledTimes(eligible ? 1 : 0);
    expect(response.request.requestHeaders['X-XSRF-TOKEN']).toBe(eligible ? 'secret' : undefined);
  });

  it('preserves synchronous dispatch when Cookie Store has no get capability', async () => {
    vi.stubGlobal('cookieStore', {});
    const promise = axios.get('/cookie-store', { adapter: 'xhr' });
    expect(requests).toHaveLength(1);
    await promise;
  });

  it.each([
    ['manual', 'cookie'],
    [false, undefined],
  ])('preserves XSRF header replacement and opt-out: %s', async (initial, expected) => {
    vi.stubGlobal('cookieStore', { get: vi.fn().mockResolvedValue({ value: 'cookie' }) });
    const response = await axios.get('/cookie-store', {
      adapter: 'xhr',
      headers: { 'X-XSRF-TOKEN': initial },
    });
    expect(response.request.requestHeaders['X-XSRF-TOKEN']).toBe(expected);
  });

  it('falls back when accessing Cookie Store itself throws', async () => {
    document.cookie = 'XSRF-TOKEN=abc%2Fdef; path=/';
    vi.stubGlobal('cookieStore', undefined);
    Object.defineProperty(window, 'cookieStore', {
      configurable: true,
      get() {
        throw new Error('unavailable');
      },
    });
    const response = await axios.get('/cookie-store', { adapter: 'xhr' });
    expect(response.request.requestHeaders['X-XSRF-TOKEN']).toBe('abc/def');
  });

  describe('timeout and cancellation during preparation', () => {
    let finishRead;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal('cookieStore', {
        get: vi.fn(
          () =>
            new Promise((resolve) => {
              finishRead = resolve;
            })
        ),
      });
    });

    it.each([
      [{}, 'ECONNABORTED', 'timeout of 50ms exceeded'],
      [{ transitional: { clarifyTimeoutError: true } }, 'ETIMEDOUT', 'timeout of 50ms exceeded'],
      [{ timeoutErrorMessage: 'custom deadline' }, 'ECONNABORTED', 'custom deadline'],
    ])(
      'times out a stalled cookie read with existing diagnostics: %j',
      async (config, code, message) => {
        const source = axios.CancelToken.source();
        const unsubscribe = vi.spyOn(source.token, 'unsubscribe');
        const { result, controller } = startRequest({
          timeout: 50,
          cancelToken: source.token,
          ...config,
        });
        const removeListener = vi.spyOn(controller.signal, 'removeEventListener');

        await vi.advanceTimersByTimeAsync(50);
        expect(result.error).toMatchObject({ code, message, config: { timeout: 50 } });
        expect(axios.isAxiosError(result.error)).toBe(true);
        expect(unsubscribe).toHaveBeenCalled();
        expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
        expect(vi.getTimerCount()).toBe(0);

        finishRead({ value: 'late' });
        await vi.advanceTimersByTimeAsync(0);
        expect(requests).toHaveLength(0);
      }
    );

    it('uses one timeout budget for both the cookie read and the XHR', async () => {
      completeRequests = false;
      const abort = vi.spyOn(MockXMLHttpRequest.prototype, 'abort');
      const { result } = startRequest({ timeout: 50 });
      await vi.advanceTimersByTimeAsync(40);
      finishRead({ value: 'token' });
      await vi.advanceTimersByTimeAsync(0);
      expect(requests).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(9);
      expect(result.error).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);
      expect(result.error).toMatchObject({
        code: 'ECONNABORTED',
        message: 'timeout of 50ms exceeded',
      });
      expect(abort).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('does not send when the cookie promise settles before an overdue timer runs', async () => {
      const { result } = startRequest({ timeout: 50 });
      vi.spyOn(performance, 'now').mockReturnValue(51);
      finishRead({ value: 'late' });
      await result.promise;
      expect(result.error.code).toBe('ECONNABORTED');
      expect(requests).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('enforces the deadline without a cancellation token or signal', async () => {
      const { result } = startRequest({ timeout: 50, signal: undefined });
      await vi.advanceTimersByTimeAsync(50);
      expect(result.error.code).toBe('ECONNABORTED');
      expect(requests).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('clears the deadline and both cancellation subscriptions after success', async () => {
      const source = axios.CancelToken.source();
      const unsubscribe = vi.spyOn(source.token, 'unsubscribe');
      const { result, controller } = startRequest({ timeout: 50, cancelToken: source.token });
      const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
      finishRead({ value: 'token' });
      await result.promise;
      expect(result.response.status).toBe(200);
      expect(unsubscribe).toHaveBeenCalled();
      expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['signal', 'cancelToken'])(
      'cancels via %s and ignores late cookie results',
      async (kind) => {
        const source = axios.CancelToken.source();
        const { result, controller } = startRequest({ timeout: 50, cancelToken: source.token });
        kind === 'signal' ? controller.abort() : source.cancel('canceled');
        await result.promise;
        expect(result.error.code).toBe('ERR_CANCELED');
        expect(vi.getTimerCount()).toBe(0);
        finishRead({ value: 'late' });
        await vi.advanceTimersByTimeAsync(0);
        expect(requests).toHaveLength(0);
      }
    );

    it('keeps timeout zero unlimited while retaining cancellation', async () => {
      const { result, controller } = startRequest({ timeout: 0 });
      await vi.advanceTimersByTimeAsync(10000);
      expect(result.error).toBeUndefined();
      expect(vi.getTimerCount()).toBe(0);
      controller.abort();
      await result.promise;
      expect(result.error.code).toBe('ERR_CANCELED');
    });

    it('does not overflow long XHR timeouts into an immediate failure', async () => {
      const { result, controller } = startRequest({ timeout: 0x80000000 });
      await vi.advanceTimersByTimeAsync(1);
      expect(result.error).toBeUndefined();
      controller.abort();
      await result.promise;
      expect(result.error.code).toBe('ERR_CANCELED');
      expect(vi.getTimerCount()).toBe(0);
    });

    it('cleans up when both cookie APIs reject access', async () => {
      vi.stubGlobal('cookieStore', { get: vi.fn().mockRejectedValue(new Error('denied')) });
      vi.spyOn(cookies, 'read').mockImplementation(() => {
        throw new Error('cookie access denied');
      });
      const { result, controller } = startRequest({ timeout: 50 });
      const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
      await result.promise;
      expect(axios.isAxiosError(result.error)).toBe(true);
      expect(result.error.message).toBe('cookie access denied');
      expect(removeListener).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(requests).toHaveLength(0);
    });
  });
});
