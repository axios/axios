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

  it('reads cookies when the cookie separator has no following space', () => {
    const descriptor = Object.getOwnPropertyDescriptor(document, 'cookie');

    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() {
        return 'foo=abc;bar=def';
      },
    });

    try {
      expect(cookies.read('bar')).toBe('def');
    } finally {
      if (descriptor) {
        Object.defineProperty(document, 'cookie', descriptor);
      } else {
        delete document.cookie;
      }
    }
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

  it('matches cookie names exactly even when the name contains regex metacharacters', () => {
    // previously cookies.read built a RegExp by interpolating
    // the requested name. Metacharacters could match a different cookie or trigger
    // catastrophic backtracking. A name such as "X.Y" must not match a cookie called
    // "XAY" set by the same site.
    cookies.write('XAY', 'wrong');

    expect(cookies.read('X.Y')).toBeNull();
  });

  it('does not return a partial match for a name that is a prefix of another cookie', () => {
    cookies.write('xsrf-token-extra', 'wrong');

    expect(cookies.read('xsrf-token')).toBeNull();
  });
});
