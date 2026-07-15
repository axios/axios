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
  const initialLength = requests.length;
  const responsePromise = axios(url, config);

  const startTime = Date.now();
  while (requests.length === initialLength && Date.now() - startTime < 1000) {
    await new Promise((resolve) => queueMicrotask(resolve));
  }

  const request = requests.at(-1);

  expect(request).toBeDefined();
  await responsePromise;

  return request;
};

describe('xsrf (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    clearXsrfCookie();
    window.XMLHttpRequest = OriginalXMLHttpRequest;
    vi.restoreAllMocks();
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

  describe('async cookieStore XSRF support', () => {
    let mockStore;
    let originalCookieStore;

    beforeEach(() => {
      mockStore = new Map();
      originalCookieStore = window.cookieStore;
      Object.defineProperty(window, 'cookieStore', {
        configurable: true,
        writable: true,
        value: {
          get: vi.fn(async (name) => {
            const val = mockStore.get(name);
            return val !== undefined ? { name, value: val } : null;
          })
        }
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'cookieStore', {
        configurable: true,
        writable: true,
        value: originalCookieStore
      });
    });

    it('should set xsrf header via cookieStore and assert the async branch runs', async () => {
      const token = 'async-token-123';
      mockStore.set(axios.defaults.xsrfCookieName, token);

      const request = await sendRequest('/foo');

      expect(window.cookieStore.get).toHaveBeenCalledWith(axios.defaults.xsrfCookieName);
      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);
    });

    it('should fallback to document.cookie when cookieStore is undefined', async () => {
      window.cookieStore = undefined;
      const token = 'fallback-token-456';
      setXsrfCookie(token);

      const request = await sendRequest('/foo');

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);
    });

    it('should support raw-value round-trip (no decoding/encoding for special characters)', async () => {
      const rawToken = 'raw value %20 special';
      mockStore.set(axios.defaults.xsrfCookieName, rawToken);

      const request = await sendRequest('/foo');

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(rawToken);
    });

    it('should still respect the own(key) guard and withXSRFToken gating', async () => {
      const token = 'gated-token';
      mockStore.set(axios.defaults.xsrfCookieName, token);

      // test withXSRFToken = false gating
      const requestGated = await sendRequest('/foo', {
        withXSRFToken: false
      });
      expect(requestGated.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();

      // test withXSRFToken = true cross-origin (should send)
      const requestCrossTrue = await sendRequest('http://example.com/', {
        withXSRFToken: true
      });
      expect(requestCrossTrue.requestHeaders[axios.defaults.xsrfHeaderName]).toBe(token);

      // test withXSRFToken = undefined cross-origin (should not send)
      const requestCrossDefault = await sendRequest('http://example.com/');
      expect(requestCrossDefault.requestHeaders[axios.defaults.xsrfHeaderName]).toBeUndefined();
    });
  });
});
