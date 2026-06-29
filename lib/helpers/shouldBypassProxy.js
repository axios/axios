const LOOPBACK_HOSTNAMES = new Set(['localhost', '0.0.0.0']);

const isIPv4Loopback = (host) => {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  if (parts[0] !== '127') return false;
  return parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
};

/**
 * Canonicalize an IPv4 address written in shorthand, octal, or hex form into
 * dotted-decimal. IPv6 addresses and non-IP strings are returned unchanged so
 * the existing IPv4-mapped IPv6 unmap path and the isLoopback path can still
 * see them.
 *
 * Shorthand expansion mirrors Node's URL parser: literal parts fill from the
 * left, the final part fills the remaining octets from the right with
 * zero-padding on the left.
 *   127.1     -> 127.0.0.1
 *   127.0.1   -> 127.0.0.1
 *   1.2.3     -> 1.2.0.3
 *
 * Each octet is parsed with an explicit base: 16 for `0x`/`0X` prefix, 8 for
 * zero-prefixed multi-digit all-`0-7` parts, 10 otherwise. Zero-prefixed
 * decimal-looking parts that contain `8` or `9` are rejected to match Node's
 * URL parser, and the comparison layer falls through to non-bypass if either
 * side rejects the form (fail-safe).
 *
 * Returns the input unchanged on any parse failure, out-of-range octet, or
 * unusual shape (1-part, 5+ parts) so the comparison layer fails closed.
 */
const parseIPv4Octet = (text) => {
  if (/^0[xX][0-9a-fA-F]+$/.test(text)) {
    const n = parseInt(text.slice(2), 16);
    return Number.isFinite(n) ? n : null;
  }
  if (text.length > 1 && /^0[0-7]+$/.test(text)) {
    const n = parseInt(text, 8);
    return Number.isFinite(n) ? n : null;
  }
  if (text.length > 1 && /^0[0-9]+$/.test(text)) {
    return null;
  }
  if (/^[0-9]+$/.test(text)) {
    const n = parseInt(text, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const normalizeIPAddress = (host) => {
  if (typeof host !== 'string' || !host || host.indexOf(':') !== -1) {
    return host;
  }

  let h = host;
  if (h.charAt(0) === '[' && h.charAt(h.length - 1) === ']') {
    h = h.slice(1, -1);
  }
  h = h.replace(/\.+$/, '');

  // Allowed characters for any IPv4 shape: digits, dot, 'x', 'X', hex digits.
  if (!/^[0-9.xXa-fA-F]+$/.test(h)) return host;

  const parts = h.split('.');

  // No part may be empty (e.g. "127..0.1" or "127.0.0."). Trailing dots are
  // already stripped above; this guards against the empty-middle case.
  if (parts.some((p) => p === '')) return host;

  if (parts.length === 4) {
    // Full IPv4 form: each part is an octet.
    const octets = parts.map(parseIPv4Octet);
    if (octets.some((n) => n === null || n < 0 || n > 255)) return host;
    return octets.join('.');
  }

  if (parts.length > 4) {
    return host;
  }

  // Shorthand: 1..3 parts. Node's URL parser treats a 1-part input as a 32-bit
  // integer split into octets, which has surprising semantics (e.g. "127" ->
  // "0.0.0.127"). Reject 1-part inputs to keep the helper predictable: the
  // fail-safe returns the input unchanged and the comparison layer falls
  // through to non-bypass.
  if (parts.length === 1) return host;

  // 2..3 parts: literal parts fill from the left, tail fills remaining octets
  // from the right with zero-padding.
  const literalOctets = parts.slice(0, -1);
  const tail = parts[parts.length - 1];
  const tailSlots = 4 - literalOctets.length;

  // Tail is parsed as a full IPv4 number (hex/octal/decimal) and packed
  // low-byte-right into the remaining octets, matching Node's URL parser.
  // e.g. 127.65535 (tail 0xFFFF into 3 slots) -> 127.0.255.255;
  //      127.0x00ff (tail 0xFF into 3 slots) -> 127.0.0.255;
  //      127.0.65535 (tail 0xFFFF into 2 slots) -> 127.0.255.255.
  const tailValue = parseIPv4Octet(tail);
  if (tailValue === null) return host;
  const maxTail = (1 << (8 * tailSlots)) - 1;
  if (tailValue < 0 || tailValue > maxTail) return host;

  const tailOctets = new Array(tailSlots).fill(0);
  for (let i = tailSlots - 1, v = tailValue; i >= 0; i--, v >>= 8) {
    tailOctets[i] = v & 0xff;
  }

  const literal = literalOctets.map(parseIPv4Octet);
  if (literal.some((n) => n === null || n < 0 || n > 255)) return host;

  return [...literal, ...tailOctets].join('.');
};

const isIPv6ZeroGroup = (group) => /^0{1,4}$/.test(group);

// The unspecified address (IPv4 0.0.0.0 / IPv6 ::) resolves to the local host
// for outbound connections, so treat it as loopback-equivalent for NO_PROXY
// matching. 0.0.0.0 is covered by LOOPBACK_HOSTNAMES; this handles compressed
// and full IPv6 all-zero forms so both families bypass symmetrically.
const isIPv6Unspecified = (host) => {
  if (host === '::') return true;

  const compressionIndex = host.indexOf('::');

  if (compressionIndex !== -1) {
    if (compressionIndex !== host.lastIndexOf('::')) return false;

    const left = host.slice(0, compressionIndex);
    const right = host.slice(compressionIndex + 2);
    const leftGroups = left ? left.split(':') : [];
    const rightGroups = right ? right.split(':') : [];
    const explicitGroups = leftGroups.length + rightGroups.length;

    return (
      explicitGroups < 8 &&
      leftGroups.every(isIPv6ZeroGroup) &&
      rightGroups.every(isIPv6ZeroGroup)
    );
  }

  const groups = host.split(':');
  return groups.length === 8 && groups.every(isIPv6ZeroGroup);
};

const isIPv6Loopback = (host) => {
  // Collapse all-zero groups: any form of ::1 / 0:0:...:0:1
  // First, strip any leading "::" by normalising with Set lookup of common forms,
  // then fall back to structural check.
  if (host === '::1') return true;

  // Check IPv4-mapped IPv6 loopback: ::ffff:<v4-loopback> or ::ffff:<hex-v4-loopback>
  // Node's URL parser normalises ::ffff:127.0.0.1 → ::ffff:7f00:1
  const v4MappedDotted = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4MappedDotted) return isIPv4Loopback(v4MappedDotted[1]);

  const v4MappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (v4MappedHex) {
    const high = parseInt(v4MappedHex[1], 16);
    // High 16 bits must start with 127 (0x7f) — i.e. 0x7f00..0x7fff
    return high >= 0x7f00 && high <= 0x7fff;
  }

  // Full-form ::1 variants: any number of zero groups followed by trailing 1
  // e.g. 0:0:0:0:0:0:0:1, 0000:...:0001
  const groups = host.split(':');
  if (groups.length === 8) {
    for (let i = 0; i < 7; i++) {
      if (!/^0+$/.test(groups[i])) return false;
    }
    return /^0*1$/.test(groups[7]);
  }

  return false;
};

const isLoopback = (host) => {
  if (!host) return false;
  if (LOOPBACK_HOSTNAMES.has(host)) return true;
  if (isIPv4Loopback(host)) return true;
  if (isIPv6Unspecified(host)) return true;
  return isIPv6Loopback(host);
};

const DEFAULT_PORTS = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
};

const parseNoProxyEntry = (entry) => {
  let entryHost = entry;
  let entryPort = 0;

  if (entryHost.charAt(0) === '[') {
    const bracketIndex = entryHost.indexOf(']');

    if (bracketIndex !== -1) {
      const host = entryHost.slice(1, bracketIndex);
      const rest = entryHost.slice(bracketIndex + 1);

      if (rest.charAt(0) === ':' && /^\d+$/.test(rest.slice(1))) {
        entryPort = Number.parseInt(rest.slice(1), 10);
      }

      return [host, entryPort];
    }
  }

  const firstColon = entryHost.indexOf(':');
  const lastColon = entryHost.lastIndexOf(':');

  if (
    firstColon !== -1 &&
    firstColon === lastColon &&
    /^\d+$/.test(entryHost.slice(lastColon + 1))
  ) {
    entryPort = Number.parseInt(entryHost.slice(lastColon + 1), 10);
    entryHost = entryHost.slice(0, lastColon);
  }

  return [entryHost, entryPort];
};

// Convert IPv4-mapped IPv6 (::ffff:0:0/96 prefix) to IPv4 dotted form so both
// sides of a NO_PROXY comparison see the same canonical address. Without this,
// `NO_PROXY=192.168.1.5` would not match a request to `http://[::ffff:192.168.1.5]/`
// (Node's URL parser normalises that to `[::ffff:c0a8:105]`), and vice-versa,
// allowing the proxy-bypass policy to be circumvented by using the alternate
// representation. Returns the input unchanged when not IPv4-mapped.
const IPV4_MAPPED_DOTTED_RE = /^(?:::|(?:0{1,4}:){1,4}:|(?:0{1,4}:){5})ffff:(\d+\.\d+\.\d+\.\d+)$/i;
const IPV4_MAPPED_HEX_RE = /^(?:::|(?:0{1,4}:){1,4}:|(?:0{1,4}:){5})ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i;

const unmapIPv4MappedIPv6 = (host) => {
  if (typeof host !== 'string' || host.indexOf(':') === -1) return host;

  const dotted = host.match(IPV4_MAPPED_DOTTED_RE);
  if (dotted) return dotted[1];

  const hex = host.match(IPV4_MAPPED_HEX_RE);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
  }

  return host;
};

const normalizeNoProxyHost = (hostname) => {
  if (!hostname) {
    return hostname;
  }

  if (hostname.charAt(0) === '[' && hostname.charAt(hostname.length - 1) === ']') {
    hostname = hostname.slice(1, -1);
  }

  const trimmed = hostname.replace(/\.+$/, '');

  // IPv4 shorthand/octal/hex → dotted-decimal; helper is a no-op for inputs
  // containing ':' (IPv6 and IPv4-mapped IPv6) so we fall through to unmap.
  const ipv4 = normalizeIPAddress(trimmed);
  if (ipv4 !== trimmed) {
    return ipv4;
  }

  return unmapIPv4MappedIPv6(trimmed);
};

export default function shouldBypassProxy(location) {
  let parsed;

  try {
    parsed = new URL(location);
  } catch (_err) {
    return false;
  }

  const noProxy = (process.env.no_proxy || process.env.NO_PROXY || '').toLowerCase();

  if (!noProxy) {
    return false;
  }

  if (noProxy === '*') {
    return true;
  }

  const port =
    Number.parseInt(parsed.port, 10) || DEFAULT_PORTS[parsed.protocol.split(':', 1)[0]] || 0;

  const hostname = normalizeNoProxyHost(parsed.hostname.toLowerCase());

  return noProxy.split(/[\s,]+/).some((entry) => {
    if (!entry) {
      return false;
    }

    let [entryHost, entryPort] = parseNoProxyEntry(entry);

    entryHost = normalizeNoProxyHost(entryHost);

    if (!entryHost) {
      return false;
    }

    if (entryPort && entryPort !== port) {
      return false;
    }

    if (entryHost.charAt(0) === '*') {
      entryHost = entryHost.slice(1);
    }

    if (entryHost.charAt(0) === '.') {
      return hostname.endsWith(entryHost);
    }

    return hostname === entryHost || (isLoopback(hostname) && isLoopback(entryHost));
  });
}
