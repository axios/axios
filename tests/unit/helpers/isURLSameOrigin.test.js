import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadHelper(origin, navigator = { userAgent: 'Mozilla/5.0' }) {
  // The helper captures the page origin at module initialization. Keep native URL
  // parsing while providing a fresh browser environment for each import.
  vi.resetModules();
  vi.stubGlobal('window', { location: { href: origin } });
  vi.stubGlobal('document', { baseURI: origin });
  vi.stubGlobal('navigator', navigator);

  return (await import('../../../lib/helpers/isURLSameOrigin.js')).default;
}

describe('helpers::isURLSameOrigin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each([
    ['a modern user agent', { userAgent: 'Mozilla/5.0' }],
    ['an MSIE user agent', { userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0)' }],
    ['a Trident user agent', { userAgent: 'Mozilla/5.0 Trident/7.0' }],
    ['no navigator', null],
  ])('preserves origin boundaries with %s', async (description, navigator) => {
    const isURLSameOrigin = await loadHelper('https://app.example/', navigator);

    expect(isURLSameOrigin('/resource')).toBe(true);
    expect(isURLSameOrigin('https://app.example:443/resource')).toBe(true);
    expect(isURLSameOrigin('https://APP.EXAMPLE/resource')).toBe(true);
    expect(isURLSameOrigin('https://app.example:8443/resource')).toBe(false);
    expect(isURLSameOrigin('//app.example:8443/resource')).toBe(false);
    expect(isURLSameOrigin('http://app.example/resource')).toBe(false);
    expect(isURLSameOrigin('https://other.example/resource')).toBe(false);
    expect(isURLSameOrigin('https://app.example@other.example/resource')).toBe(false);
  });

  it.each([
    ['http', '80'],
    ['https', '443'],
  ])('normalizes the default port for %s', async (protocol, port) => {
    const isURLSameOrigin = await loadHelper(`${protocol}://app.example:${port}/`);

    expect(isURLSameOrigin(`${protocol}://app.example/resource`)).toBe(true);
    expect(isURLSameOrigin(`${protocol}://app.example:${port}/resource`)).toBe(true);
  });

  it('preserves the fallback outside standard browser environments', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', undefined);
    const { default: isURLSameOrigin } = await import('../../../lib/helpers/isURLSameOrigin.js');

    expect(isURLSameOrigin('https://other.example/resource')).toBe(true);
  });
});
