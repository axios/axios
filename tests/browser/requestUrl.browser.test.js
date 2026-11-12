import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import axios from '../../index.js';

// Records every XHR the adapter opens and answers it with an empty 200.
class RecordingXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.onloadend = null;
    this.upload = { addEventListener() {} };
  }

  open(method, url) {
    this.url = url;
    opened.push(url);
  }

  setRequestHeader() {}

  addEventListener() {}

  getAllResponseHeaders() {
    return '';
  }

  send() {
    this.status = 200;
    this.statusText = 'OK';
    this.readyState = 4;

    queueMicrotask(() => this.onloadend && this.onloadend());
  }

  abort() {}
}

let opened = [];
let OriginalXMLHttpRequest;

const PARAMS = { foo: 'bar' };

const expectGuardRejection = (promise) =>
  expect(promise).rejects.toMatchObject({
    name: 'AxiosError',
    code: 'ERR_INVALID_URL',
    message: expect.stringMatching(/for a dispatched request$/),
  });

describe('request url validation (vitest browser)', () => {
  beforeEach(() => {
    opened = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = RecordingXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  describe('xhr adapter', () => {
    it.each([null, undefined])(
      'rejects a %s url with params instead of requesting the current page',
      async (url) => {
        await expectGuardRejection(axios.get(url, { params: PARAMS }));

        expect(opened).toEqual([]);
      }
    );

    it.each([null, undefined])('rejects a %s url without params', async (url) => {
      await expectGuardRejection(axios.get(url));

      expect(opened).toEqual([]);
    });

    it('still sends an empty-string url as a relative url', async () => {
      await axios.get('', { params: PARAMS });

      expect(opened).toEqual(['?foo=bar']);
    });

    it.each([null, undefined])('sends a %s url to the configured baseURL', async (url) => {
      await axios.get(url, { baseURL: '/api', params: PARAMS });

      expect(opened).toEqual(['/api?foo=bar']);
    });

    it('rejects a nullish url even when a socketPath is set', async () => {
      await expectGuardRejection(axios.get(null, { socketPath: '/app.sock', params: PARAMS }));

      expect(opened).toEqual([]);
    });
  });

  describe('fetch adapter', () => {
    const fetchConfig = (fetch, overrides = {}) => ({
      adapter: 'fetch',
      env: { fetch },
      params: PARAMS,
      ...overrides,
    });

    it.each([null, undefined])(
      'rejects a %s url with params instead of requesting the current page',
      async (url) => {
        const fetch = vi.fn(async () => new Response('ok'));

        await expectGuardRejection(axios.get(url, fetchConfig(fetch)));

        expect(fetch).not.toHaveBeenCalled();
      }
    );

    it.each([null, undefined])(
      'rejects a %s url when the fetch adapter is passed as a function',
      async (url) => {
        const fetch = vi.spyOn(window, 'fetch');

        try {
          await expectGuardRejection(
            axios.get(url, { adapter: axios.getAdapter('fetch'), params: PARAMS })
          );

          expect(fetch).not.toHaveBeenCalled();
        } finally {
          fetch.mockRestore();
        }
      }
    );

    it('still sends an empty-string url as a relative url', async () => {
      const fetch = vi.fn(async () => new Response('ok'));

      await axios.get('', fetchConfig(fetch));

      expect(fetch).toHaveBeenCalledTimes(1);

      const expected = new URL('?foo=bar', window.location.href).href;

      expect(fetch.mock.calls[0][0].url).toBe(expected);
    });
  });
});
