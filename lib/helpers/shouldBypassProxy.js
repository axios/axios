const LOOPBACK_HOSTNAMES = new Set(['localhost']);

const isIPv4Loopback = (host) => {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  if (parts[0] !== '127') return false;
  return parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
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

  return unmapIPv4MappedIPv6(hostname.replace(/\.+$/, ''));
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
