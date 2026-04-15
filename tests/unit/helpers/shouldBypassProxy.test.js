import { afterEach, describe, expect, it } from 'vitest';
import shouldBypassProxy from '../../../lib/helpers/shouldBypassProxy.js';

const originalNoProxy = process.env.no_proxy;
const originalNOProxy = process.env.NO_PROXY;

const setNoProxy = (value) => {
  process.env.no_proxy = value;
  process.env.NO_PROXY = value;
};

afterEach(() => {
  if (originalNoProxy === undefined) {
    delete process.env.no_proxy;
  } else {
    process.env.no_proxy = originalNoProxy;
  }

  if (originalNOProxy === undefined) {
    delete process.env.NO_PROXY;
  } else {
    process.env.NO_PROXY = originalNOProxy;
  }
});

describe('helpers::shouldBypassProxy', () => {
  it('should bypass proxy for localhost with a trailing dot', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://localhost.:8080/')).toBe(true);
  });

  it('should bypass proxy for bracketed ipv6 loopback', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://[::1]:8080/')).toBe(true);
  });

  it('should support bracketed ipv6 entries in no_proxy', () => {
    setNoProxy('[::1]');

    expect(shouldBypassProxy('http://[::1]:8080/')).toBe(true);
  });

  it('should bypass proxy for 127.0.0.1 when no_proxy contains localhost', () => {
    setNoProxy('localhost');

    expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(true);
  });

  it('should bypass proxy for [::1] when no_proxy contains localhost', () => {
    setNoProxy('localhost');

    expect(shouldBypassProxy('http://[::1]:7777/')).toBe(true);
  });

  it('should bypass proxy for localhost when no_proxy contains 127.0.0.1', () => {
    setNoProxy('127.0.0.1');

    expect(shouldBypassProxy('http://localhost:7777/')).toBe(true);
  });

  it('should bypass proxy for localhost when no_proxy contains ::1', () => {
    setNoProxy('::1');

    expect(shouldBypassProxy('http://localhost:7777/')).toBe(true);
  });

  it('should match wildcard and explicit ports', () => {
    setNoProxy('*.example.com,localhost:8080');

    expect(shouldBypassProxy('http://api.example.com/')).toBe(true);
    expect(shouldBypassProxy('http://localhost:8080/')).toBe(true);
    expect(shouldBypassProxy('http://localhost:8081/')).toBe(false);
  });

  it('should bypass proxy for any host when no_proxy is *', () => {
    setNoProxy('*');

    expect(shouldBypassProxy('http://example.com/')).toBe(true);
    expect(shouldBypassProxy('http://localhost:1234/')).toBe(true);
    expect(shouldBypassProxy('http://[::1]:8080/')).toBe(true);
  });

  it('should support bracketed ipv6 with explicit port in no_proxy', () => {
    setNoProxy('[::1]:8080');

    expect(shouldBypassProxy('http://[::1]:8080/')).toBe(true);
    expect(shouldBypassProxy('http://[::1]:8081/')).toBe(false);
  });

  it('should not bypass when no_proxy is empty', () => {
    setNoProxy('');

    expect(shouldBypassProxy('http://localhost:8080/')).toBe(false);
  });

  it('should not bypass for malformed URLs', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('not a url')).toBe(false);
  });
});
