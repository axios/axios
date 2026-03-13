import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import cookies from '../../lib/helpers/cookies.js';

const clearAllCookies = () => {
  const expiry = new Date(Date.now() - 86400000).toUTCString();

  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();

    if (!name) {
      continue;
    }

    // Clear both default-path and root-path cookies for the same key.
    document.cookie = `${name}=; expires=${expiry}`;
    document.cookie = `${name}=; expires=${expiry}; path=/`;
  }
};

describe('helpers::cookies (vitest browser)', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  afterEach(() => {
    clearAllCookies();
  });

  it('writes cookies', () => {
    cookies.write('foo', 'baz');

    expect(document.cookie).toBe('foo=baz');
  });

  it('reads cookies', () => {
    cookies.write('foo', 'abc');
    cookies.write('bar', 'def');

    expect(cookies.read('foo')).toBe('abc');
    expect(cookies.read('bar')).toBe('def');
  });

  it('removes cookies', () => {
    cookies.write('foo', 'bar');
    cookies.remove('foo');

    expect(cookies.read('foo')).toBeNull();
  });

  it('uri encodes values', () => {
    cookies.write('foo', 'bar baz%');

    expect(document.cookie).toBe('foo=bar%20baz%25');
  });
});
