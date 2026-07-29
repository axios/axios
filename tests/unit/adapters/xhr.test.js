import { afterEach, describe, expect, it, vi } from 'vitest';

// The xhr adapter fixes `isXHRAdapterSupported` and `platform.origin` at module load,
// so each case stubs the globals first and imports axios into a fresh module registry.
// The stub fires only readystatechange and loadend with status 0, which is both the
// Firefox 152 navigation-cancel shape (https://bugzilla.mozilla.org/show_bug.cgi?id=1505389)
// and the shape of a successful file: read in an environment without responseURL.

class StubXMLHttpRequest {
  constructor() {
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
  }

  open() {}

  setRequestHeader() {}

  getAllResponseHeaders() {
    return '';
  }

  abort() {}

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
