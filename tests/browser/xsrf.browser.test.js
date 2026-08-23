import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import axios from '../../index.js';
import cookies from '../../lib/helpers/cookies.js';

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
    this.readyState = 0;
    this.status = 200;
    this.statusText = 'OK';
    this.responseText = '';
    this.timeout = 0;
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
    return '';
  }

  send() {
    requests.push(this);
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

const setXsrfCookie = (value) => {
  document.cookie = `${axios.defaults.xsrfCookieName}=${value}; path=/`;
};

const clearXsrfCookie = () => {
  document.cookie = `${axios.defaults.xsrfCookieName}=; expires=${new Date(
    Date.now() - 86400000
  ).toUTCString()}; path=/`;
};

const sendRequest = async (url, config) => {
  const responsePromise = axios(url, config);

  await vi.waitFor(() => expect(requests.at(-1)).toBeDefined());
  const request = requests.at(-1);

  await responsePromise;

  return request;
};

describe('xsrf (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
    vi.stubGlobal('cookieStore', undefined);
  });

  afterEach(() => {
    clearXsrfCookie();
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should not set xsrf header if cookie is null', async () => {
    const request = await sendRequest('/foo');

    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
  });

  it('should set xsrf header if cookie is set', async () => {
    setXsrfCookie('12345');

    const request = await sendRequest('/foo');

    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe('12345');
  });

  it('should read the raw xsrf value from cookieStore when available', async () => {
    const get = vi.fn().mockResolvedValue({
      name: axios.defaults.xsrfCookieName,
      value: 'raw%2Fvalue',
    });
    const readSpy = vi.spyOn(cookies, 'read');

    vi.stubGlobal('cookieStore', { get });

    const request = await sendRequest('/foo');

    expect(get).toHaveBeenCalledWith(axios.defaults.xsrfCookieName);
    expect(readSpy).not.toHaveBeenCalled();
    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe('raw%2Fvalue');
  });

  it('should fall back to document.cookie if cookieStore.get rejects', async () => {
    setXsrfCookie('fallback');
    const get = vi.fn().mockRejectedValue(new Error('cookieStore unavailable'));
    const readSpy = vi.spyOn(cookies, 'read');

    vi.stubGlobal('cookieStore', { get });

    const request = await sendRequest('/foo');

    expect(get).toHaveBeenCalledWith(axios.defaults.xsrfCookieName);
    expect(readSpy).toHaveBeenCalledWith(axios.defaults.xsrfCookieName);
    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe('fallback');
  });

  it('should not read cookieStore for a cross-origin request by default', async () => {
    const get = vi.fn().mockResolvedValue({ value: 'secret' });

    vi.stubGlobal('cookieStore', { get });

    const request = await sendRequest('http://example.com/');

    expect(get).not.toHaveBeenCalled();
    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
  });

  it('should clean up cancellation while cookieStore.get is pending', async () => {
    const source = axios.CancelToken.source();
    const unsubscribeSpy = vi.spyOn(source.token, 'unsubscribe');

    vi.stubGlobal('cookieStore', {
      get: vi.fn(() => new Promise(() => {})),
    });

    const responsePromise = axios('/foo', { cancelToken: source.token });

    await vi.waitFor(() => expect(source.token._listeners).toHaveLength(1));
    source.cancel('canceled');

    await expect(responsePromise).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    expect(unsubscribeSpy).toHaveBeenCalledOnce();
    expect(requests).toHaveLength(0);
  });

  it('should clean up an abort signal while cookieStore.get is pending', async () => {
    const controller = new AbortController();
    const removeEventListenerSpy = vi.spyOn(controller.signal, 'removeEventListener');

    vi.stubGlobal('cookieStore', {
      get: vi.fn(() => new Promise(() => {})),
    });

    const responsePromise = axios('/foo', { signal: controller.signal });

    controller.abort();

    await expect(responsePromise).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    expect(removeEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(requests).toHaveLength(0);
  });

  it('should not read cookieStore or dispatch XHR for an already aborted signal', async () => {
    const controller = new AbortController();
    const get = vi.fn(() => new Promise(() => {}));

    controller.abort();
    vi.stubGlobal('cookieStore', { get });

    await expect(axios('/foo', { signal: controller.signal })).rejects.toMatchObject({
      code: 'ERR_CANCELED',
    });

    expect(get).not.toHaveBeenCalled();
    expect(requests).toHaveLength(0);
  });

  it('should not set xsrf header if xsrfCookieName is null', async () => {
    setXsrfCookie('12345');

    const request = await sendRequest('/foo', {
      xsrfCookieName: null,
    });

    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
  });

  it('should not read cookies at all if xsrfCookieName is null', async () => {
    const readSpy = vi.spyOn(cookies, 'read');

    await sendRequest('/foo', {
      xsrfCookieName: null,
    });

    expect(readSpy).not.toHaveBeenCalled();
  });

  it('should not set xsrf header for cross origin', async () => {
    setXsrfCookie('12345');

    const request = await sendRequest('http://example.com/');

    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
  });

  it('should not set xsrf header for cross origin when using withCredentials', async () => {
    setXsrfCookie('12345');

    const request = await sendRequest('http://example.com/', {
      withCredentials: true,
    });

    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
  });

  describe('withXSRFToken option', () => {
    it('should set xsrf header for cross origin when withXSRFToken = true', async () => {
      const token = '12345';

      setXsrfCookie(token);

      const request = await sendRequest('http://example.com/', {
        withXSRFToken: true,
      });

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);
    });

    it('should not set xsrf header for the same origin when withXSRFToken = false', async () => {
      const token = '12345';

      setXsrfCookie(token);

      const request = await sendRequest('/foo', {
        withXSRFToken: false,
      });

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
    });

    it('should support function resolver', async () => {
      const token = '12345';

      setXsrfCookie(token);

      const request = await sendRequest('/foo', {
        withXSRFToken: (config) => config.userFlag === 'yes',
        userFlag: 'yes',
      });

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);
    });
  });

  // Non-boolean truthy withXSRFToken must not short-circuit
  // the same-origin check and leak the XSRF token cross-origin.
  describe('non-boolean withXSRFToken', () => {
    afterEach(() => {
      delete Object.prototype.withXSRFToken;
    });

    const leakCases = [
      ['number 1', 1],
      ['string "false"', 'false'],
      ['empty object', {}],
      ['empty array', []],
    ];

    leakCases.forEach(([label, value]) => {
      it(`should not send xsrf header cross-origin when withXSRFToken = ${label}`, async () => {
        setXsrfCookie('12345');

        const request = await sendRequest('http://example.com/', {
          withXSRFToken: value,
        });

        expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
      });
    });

    it('should not send xsrf header cross-origin when Object.prototype.withXSRFToken is polluted', async () => {
      Object.prototype.withXSRFToken = 1;
      setXsrfCookie('12345');

      const request = await sendRequest('http://example.com/');

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
    });

    it('should still send xsrf header cross-origin when withXSRFToken === true (strict)', async () => {
      const token = '12345';
      setXsrfCookie(token);

      const request = await sendRequest('http://example.com/', {
        withXSRFToken: true,
      });

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);
    });

    it('should still send xsrf header same-origin when withXSRFToken is undefined', async () => {
      const token = '12345';
      setXsrfCookie(token);

      const request = await sendRequest('/foo');

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);
    });
  });
});
