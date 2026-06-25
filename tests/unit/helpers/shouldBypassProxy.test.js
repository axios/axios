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

  it('should bypass proxy for 0.0.0.0 when no_proxy contains a local entry', () => {
    for (const entry of ['localhost', '127.0.0.1', '::1']) {
      setNoProxy(entry);

      expect(shouldBypassProxy('http://0.0.0.0:7777/')).toBe(true);
    }
  });

  it('should respect explicit ports for 0.0.0.0 local matching', () => {
    setNoProxy('localhost:8080');

    expect(shouldBypassProxy('http://0.0.0.0:8080/')).toBe(true);
    expect(shouldBypassProxy('http://0.0.0.0:9090/')).toBe(false);
  });

  it('should bypass proxy for the IPv6 unspecified address symmetrically with 0.0.0.0', () => {
    for (const entry of ['localhost', '127.0.0.1', '::1']) {
      setNoProxy(entry);

      expect(shouldBypassProxy('http://[::]:7777/')).toBe(true);
      expect(shouldBypassProxy('http://[0:0:0:0:0:0:0:0]:7777/')).toBe(true);
    }
  });

  it('should bypass proxy for compressed IPv6 unspecified request forms', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    for (const host of ['0::', '::0', '0:0::', '::0:0', '0::0']) {
      expect(shouldBypassProxy(`http://[${host}]:7777/`)).toBe(true);
    }
  });

  it('should bypass proxy for compressed IPv6 unspecified no_proxy entries', () => {
    for (const entry of ['0::', '::0', '0:0::', '::0:0', '0::0']) {
      setNoProxy(entry);

      expect(shouldBypassProxy('http://[::]:7777/')).toBe(true);
      expect(shouldBypassProxy('http://[0:0:0:0:0:0:0:0]:7777/')).toBe(true);
    }
  });

  it('should respect explicit ports on compressed IPv6 unspecified no_proxy entries', () => {
    setNoProxy('[0::]:8080');

    expect(shouldBypassProxy('http://[::]:8080/')).toBe(true);
    expect(shouldBypassProxy('http://[::]:9090/')).toBe(false);
  });

  it('should not treat nonzero compressed IPv6 addresses as unspecified', () => {
    setNoProxy('0::2');

    expect(shouldBypassProxy('http://[::]:7777/')).toBe(false);
  });

  it('should still route a real public IPv6 host through the proxy', () => {
    setNoProxy('localhost');

    expect(shouldBypassProxy('http://[2001:db8::1]:7777/')).toBe(false);
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

  it('should bypass proxy for 127.0.0.0/8 subnet when no_proxy contains 127.0.0.1', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://127.0.0.2:9191/secret')).toBe(true);
    expect(shouldBypassProxy('http://127.0.0.100:9191/secret')).toBe(true);
    expect(shouldBypassProxy('http://127.1.2.3:9191/secret')).toBe(true);
    expect(shouldBypassProxy('http://127.255.255.254:9191/secret')).toBe(true);
  });

  it('should bypass proxy for 127.0.0.0/8 subnet when no_proxy contains localhost', () => {
    setNoProxy('localhost');

    expect(shouldBypassProxy('http://127.0.0.2:7777/')).toBe(true);
    expect(shouldBypassProxy('http://127.1.2.3:7777/')).toBe(true);
  });

  it('should NOT bypass for non-loopback IPv4 addresses', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://128.0.0.1:9191/')).toBe(false);
    expect(shouldBypassProxy('http://126.255.255.255:9191/')).toBe(false);
    expect(shouldBypassProxy('http://10.0.0.1:9191/')).toBe(false);
    expect(shouldBypassProxy('http://192.168.1.1:9191/')).toBe(false);
  });

  it('should NOT treat malformed 127-prefixed values as loopback', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    // bracketed IPv6 that happens to contain 127 dotted-form must not match IPv4 loopback
    expect(shouldBypassProxy('http://example.com/')).toBe(false);
  });

  it('should bypass proxy for full-form IPv6 loopback 0:0:0:0:0:0:0:1', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://[0:0:0:0:0:0:0:1]:8080/')).toBe(true);
  });

  it('should bypass proxy for IPv4-mapped IPv6 loopback ::ffff:127.0.0.1', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://[::ffff:127.0.0.1]:8080/')).toBe(true);
  });

  it('should treat 127.x.x.x as cross-equivalent to localhost and ::1', () => {
    setNoProxy('::1');

    expect(shouldBypassProxy('http://127.0.0.5:7777/')).toBe(true);
  });

  it('should still respect explicit port mismatch on no_proxy entries', () => {
    setNoProxy('127.0.0.1:8080');

    // same-port → bypass via cross-loopback equivalence
    expect(shouldBypassProxy('http://127.0.0.2:8080/')).toBe(true);
    // different port → no bypass
    expect(shouldBypassProxy('http://127.0.0.2:9090/')).toBe(false);
  });

  it('should not bypass for hosts that merely contain 127 in other octets', () => {
    setNoProxy('localhost,127.0.0.1,::1');

    expect(shouldBypassProxy('http://10.0.0.127:8080/')).toBe(false);
    expect(shouldBypassProxy('http://200.127.0.1:8080/')).toBe(false);
  });

  // IPv4-mapped IPv6 normalization: an attacker (or naive caller) can use the
  // IPv4-mapped IPv6 representation of an address (e.g. ::ffff:192.168.1.5)
  // to dodge a NO_PROXY policy expressed in IPv4 form, or vice-versa. After
  // canonicalising both sides, equivalent addresses compare equal.
  describe('IPv4-mapped IPv6 normalization', () => {
    it('should bypass via IPv4-mapped IPv6 request when NO_PROXY uses the IPv4 form', () => {
      setNoProxy('192.168.1.5');

      expect(shouldBypassProxy('http://[::ffff:192.168.1.5]/')).toBe(true);
    });

    it('should bypass via Node-normalised IPv4-mapped hex request against an IPv4 NO_PROXY', () => {
      // Node's URL parser canonicalises [::ffff:192.168.1.5] → [::ffff:c0a8:105].
      // The hex form must unmap to 192.168.1.5 to match the entry.
      setNoProxy('192.168.1.5');

      expect(shouldBypassProxy('http://[::ffff:c0a8:105]/')).toBe(true);
    });

    it('should bypass via plain IPv4 request when NO_PROXY uses the IPv4-mapped IPv6 dotted form', () => {
      setNoProxy('::ffff:192.168.1.5');

      expect(shouldBypassProxy('http://192.168.1.5/')).toBe(true);
    });

    it('should bypass via plain IPv4 request when NO_PROXY uses the IPv4-mapped IPv6 hex form', () => {
      setNoProxy('::ffff:a00:1');

      expect(shouldBypassProxy('http://10.0.0.1/')).toBe(true);
    });

    it('should bypass via plain IPv4 request when NO_PROXY uses a bracketed IPv4-mapped IPv6 entry', () => {
      setNoProxy('[::ffff:192.168.1.5]');

      expect(shouldBypassProxy('http://192.168.1.5/')).toBe(true);
    });

    it('should treat the uncompressed 0:0:0:0:0:ffff:<v4> form as equivalent', () => {
      setNoProxy('0:0:0:0:0:ffff:10.0.0.1');

      expect(shouldBypassProxy('http://10.0.0.1/')).toBe(true);
      expect(shouldBypassProxy('http://[::ffff:10.0.0.1]/')).toBe(true);
    });

    it('should treat compressed zero-prefix IPv4-mapped IPv6 dotted forms as equivalent', () => {
      for (const entry of [
        '0::ffff:192.168.1.5',
        '0:0::ffff:192.168.1.5',
        '0:0:0::ffff:192.168.1.5',
        '0:0:0:0::ffff:192.168.1.5',
      ]) {
        setNoProxy(entry);

        expect(shouldBypassProxy('http://192.168.1.5/')).toBe(true);
      }
    });

    it('should treat compressed zero-prefix IPv4-mapped IPv6 hex forms as equivalent', () => {
      for (const entry of [
        '0::ffff:c0a8:105',
        '0:0::ffff:c0a8:105',
        '0:0:0::ffff:c0a8:105',
        '0:0:0:0::ffff:c0a8:105',
      ]) {
        setNoProxy(entry);

        expect(shouldBypassProxy('http://192.168.1.5/')).toBe(true);
      }
    });

    it('should support compressed bracketed IPv4-mapped IPv6 entries with explicit ports', () => {
      setNoProxy('[0:0::ffff:192.168.1.5]:8080');

      expect(shouldBypassProxy('http://192.168.1.5:8080/')).toBe(true);
      expect(shouldBypassProxy('http://192.168.1.5:9090/')).toBe(false);
    });

    it('should NOT cross-match unrelated addresses', () => {
      setNoProxy('192.168.1.5');

      // Different IPv4 address inside an IPv4-mapped form must not bypass.
      expect(shouldBypassProxy('http://[::ffff:192.168.1.6]/')).toBe(false);
      // Non-mapped IPv6 must not be treated as IPv4.
      expect(shouldBypassProxy('http://[2001:db8::1]/')).toBe(false);
    });

    it('should leave non-mapped IPv6 addresses comparing as IPv6', () => {
      setNoProxy('2001:db8::1');

      expect(shouldBypassProxy('http://[2001:db8::1]/')).toBe(true);
      expect(shouldBypassProxy('http://[2001:db8::2]/')).toBe(false);
    });
  });
});
