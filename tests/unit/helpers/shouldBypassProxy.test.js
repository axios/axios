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

  // Node's URL parser accepts IPv4 shorthand, octal (0-prefixed), and hex
  // (0x-prefixed) forms in the host portion, canonicalising them to dotted-
  // decimal. Without symmetric normalisation of NO_PROXY entries, an entry
  // like `NO_PROXY=127.1` would fail to match a request to `127.0.0.1` even
  // though the user clearly meant the same host. These tests pin down both
  // sides of the comparison.
  describe('IPv4 shorthand / octal / hex normalization', () => {
    it('should match a shorthand entry against a canonical request', () => {
      setNoProxy('127.1');

      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(true);
    });

    it('should match an octal entry against a canonical request', () => {
      setNoProxy('0177.0.0.1');

      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(true);
    });

    it('should match a hex entry against a canonical request', () => {
      setNoProxy('0x7f.0.0.1');

      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(true);
    });

    it('should match a shorthand request against a canonical entry', () => {
      setNoProxy('127.0.0.1');

      // Node URL parser canonicalises shorthand `127.1` to `127.0.0.1`.
      expect(shouldBypassProxy('http://127.1:7777/')).toBe(true);
    });

    it('should match an octal request against a canonical entry', () => {
      setNoProxy('127.0.0.1');

      // Node URL parser canonicalises octal `0177.0.0.1` to `127.0.0.1`.
      expect(shouldBypassProxy('http://0177.0.0.1:7777/')).toBe(true);
    });

    it('should match a hex request against a canonical entry', () => {
      setNoProxy('127.0.0.1');

      // Node URL parser canonicalises hex `0x7f.0.0.1` to `127.0.0.1`.
      expect(shouldBypassProxy('http://0x7f.0.0.1:7777/')).toBe(true);
    });

    it('should normalise octal on non-loopback addresses symmetrically', () => {
      // Both sides use the same octal form; both canonicalise to 8.0.0.1.
      setNoProxy('010.0.0.1');

      expect(shouldBypassProxy('http://010.0.0.1:7777/')).toBe(true);
    });

    it('should treat octal `00` as equivalent to decimal `0`', () => {
      setNoProxy('00.0.0.0');

      expect(shouldBypassProxy('http://0.0.0.0:7777/')).toBe(true);
    });

    it('should NOT bypass for an out-of-range entry that the helper cannot canonicalise', () => {
      setNoProxy('999.0.0.1');

      // Helper rejects `999` (out of 0-255) so the entry stays as `999.0.0.1`,
      // which does not match the canonical request hostname.
      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(false);
    });

    it('should NOT bypass for an entry with an invalid hex digit', () => {
      setNoProxy('0xz.0.0.1');

      // `0xz` is neither hex (z is not [0-9a-fA-F]) nor octal nor decimal,
      // so the helper returns the entry unchanged and the comparison fails.
      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(false);
    });

    it('should NOT bypass for zero-prefixed entries with invalid octal digits', () => {
      for (const [entry, request] of [
        ['08.0.0.1', 'http://8.0.0.1:7777/'],
        ['127.08', 'http://127.0.0.8:7777/'],
        ['127.0.08', 'http://127.0.0.8:7777/'],
      ]) {
        setNoProxy(entry);

        // Node rejects these zero-prefixed host forms instead of treating them
        // as decimal, so entry-side normalisation must also fail closed.
        expect(shouldBypassProxy(request)).toBe(false);
      }
    });

    it('should NOT bypass when an entry is a single numeric token (32-bit-int semantics)', () => {
      setNoProxy('127');

      // Node URL parser treats 1-part as a 32-bit integer, giving `127` ->
      // `0.0.0.127`. The helper intentionally rejects 1-part inputs as
      // fail-safe so the policy falls through to non-bypass.
      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(false);
    });

    it('should preserve explicit ports across octal normalisation', () => {
      setNoProxy('0177.0.0.1:8080');

      // Same port → bypass via cross-octal equivalence.
      expect(shouldBypassProxy('http://0177.0.0.1:8080/')).toBe(true);
      // Different port → no bypass.
      expect(shouldBypassProxy('http://0177.0.0.1:9090/')).toBe(false);
    });

    it('should expand a multi-byte decimal tail low-byte-right (entry-side normalisation)', () => {
      // 127.65535 → tail 0xFFFF packed into 3 octets → 127.0.255.255.
      setNoProxy('127.65535');

      expect(shouldBypassProxy('http://127.0.255.255/')).toBe(true);
    });

    it('should expand a hex tail low-byte-right (entry-side normalisation)', () => {
      // 127.0x00ff → tail 0xFF packed into 3 octets → 127.0.0.255.
      setNoProxy('127.0x00ff');

      expect(shouldBypassProxy('http://127.0.0.255/')).toBe(true);
    });

    it('should expand an octal tail low-byte-right (entry-side normalisation)', () => {
      // 127.0177 → tail 0o177 packed into 3 octets → 127.0.0.127.
      setNoProxy('127.0177');

      expect(shouldBypassProxy('http://127.0.0.127/')).toBe(true);
    });

    it('should expand a multi-byte decimal tail in a 3-part entry', () => {
      // 127.0.65535 → tail 0xFFFF packed into 2 octets → 127.0.255.255.
      setNoProxy('127.0.65535');

      expect(shouldBypassProxy('http://127.0.255.255/')).toBe(true);
    });

    it('should expand a hex tail in a 3-part entry', () => {
      // 0.0.0xff → tail 0xFF packed into 1 octet → 0.0.0.255.
      setNoProxy('0.0.0xff');

      expect(shouldBypassProxy('http://0.0.0.255/')).toBe(true);
    });

    it('should match a canonical entry against a shorthand URL whose tail expands to the same address', () => {
      // Node URL parser canonicalises http://127.65535/ → 127.0.255.255.
      setNoProxy('127.0.255.255');

      expect(shouldBypassProxy('http://127.65535/')).toBe(true);
    });

    it('should NOT bypass when a 1-part hex entry cannot be canonicalised (preserves the deliberate 1-part rejection)', () => {
      // Node parses 0x7f as 0.0.0.127 (1-part → 32-bit split), but the helper
      // intentionally rejects 1-part inputs to keep behaviour predictable. The
      // entry stays as 0x7f; the comparison falls through to non-bypass.
      setNoProxy('0x7f');

      expect(shouldBypassProxy('http://127.0.0.127:7777/')).toBe(false);
    });

    it('should NOT bypass when a 2-part tail exceeds the remaining octet capacity (fail-safe)', () => {
      // 127.16777216 → tail 16777216 = 2^24 > 2^24 - 1, exceeds the 3-octet
      // tail capacity. The helper returns the entry unchanged; the URL host
      // normalises to `127.0.0.0`. The two sides never match, so the policy
      // correctly falls through to non-bypass.
      setNoProxy('127.16777216');

      // Lock in that the URL side parses cleanly — the fail-safe is on the
      // entry side, not the URL side (cubic-bot P3 review on commit ed73218).
      expect(new URL('http://127.0.0.0:7777/').hostname).toBe('127.0.0.0');
      expect(shouldBypassProxy('http://127.0.0.0:7777/')).toBe(false);
    });

    it('should NOT bypass when a 3-part tail exceeds the remaining octet capacity (fail-safe)', () => {
      // 127.0.65536 → tail 65536 > 2^16 - 1, exceeds the 2-octet tail
      // capacity. Same fail-safe posture as the 2-part out-of-range case.
      setNoProxy('127.0.65536');

      expect(shouldBypassProxy('http://127.0.0.1:7777/')).toBe(false);
    });
  });
});
