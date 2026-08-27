'use strict';

var URL = require('url').URL;

var DEFAULT_PORTS = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21
};

function parseNoProxyEntry(entry) {
  var entryHost = entry;
  var entryPort = 0;

  if (entryHost.charAt(0) === '[') {
    var bracketIndex = entryHost.indexOf(']');

    if (bracketIndex !== -1) {
      var host = entryHost.slice(1, bracketIndex);
      var rest = entryHost.slice(bracketIndex + 1);

      if (rest.charAt(0) === ':' && /^\d+$/.test(rest.slice(1))) {
        entryPort = parseInt(rest.slice(1), 10);
      }

      return [host, entryPort];
    }
  }

  var firstColon = entryHost.indexOf(':');
  var lastColon = entryHost.lastIndexOf(':');

  if (firstColon !== -1 && firstColon === lastColon && /^\d+$/.test(entryHost.slice(lastColon + 1))) {
    entryPort = parseInt(entryHost.slice(lastColon + 1), 10);
    entryHost = entryHost.slice(0, lastColon);
  }

  return [entryHost, entryPort];
}

// Parses a dotted-quad into its four octet strings, or null when the input is
// not an unambiguous decimal IPv4 address.
//
// Octets with a leading zero are rejected. The Node URL parser reads them the
// way inet_aton does, so `http://010.0.0.1/` arrives here as `8.0.0.1`, while a
// decimal read of the same literal would be `10.0.0.1`. Accepting the ambiguous
// form would let a no_proxy entry match a host the operator did not name.
// Rejecting fails closed: the entry falls back to literal hostname comparison,
// which will not match, so the request keeps using the proxy.
function parseIPv4Octets(hostname) {
  var octets = hostname.split('.');

  if (octets.length !== 4) {
    return null;
  }

  for (var i = 0; i < octets.length; i++) {
    if (!/^\d+$/.test(octets[i]) || Number(octets[i]) > 255) {
      return null;
    }

    if (octets[i].length > 1 && octets[i].charAt(0) === '0') {
      return null;
    }
  }

  return octets;
}

// Recognises the canonical IPv4-mapped IPv6 forms the Node URL parser produces:
//   ::ffff:127.0.0.1   (dotted-quad tail)
//   ::ffff:7f00:1      (compressed two-group hex tail)
// Fully-expanded forms like 0:0:0:0:0:ffff:7f00:1 or single-group tails like
// ::ffff:1 are not normalised here. URL inputs are canonicalised by the parser
// before reaching this helper, but hand-crafted no_proxy entries in those
// shapes will not match an IPv4 listing.
function normalizeIPv4MappedIPv6(hostname) {
  // Match against the lowercased form so a hand-crafted no_proxy entry like
  // `[::FFFF:7F00:1]` still resolves to its IPv4 alias. Callers that route via
  // URL parsing already lowercase, but the helper stays robust on its own.
  var lower = hostname.toLowerCase();
  var dottedMatch = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);

  if (dottedMatch) {
    var octets = parseIPv4Octets(dottedMatch[1]);
    return octets ? octets.join('.') : hostname;
  }

  var hexMatch = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);

  if (hexMatch) {
    var high = parseInt(hexMatch[1], 16);
    var low = parseInt(hexMatch[2], 16);

    return [
      (high >> 8) & 0xff,
      high & 0xff,
      (low >> 8) & 0xff,
      low & 0xff
    ].join('.');
  }

  return hostname;
}

// Trailing dots are trimmed without a regular expression. An anchored `/\.+$/`
// backtracks quadratically over a long run of dots that is not at the end of
// the string, and hostnames reaching this helper include redirect Location
// values, which are attacker-controlled.
function stripTrailingDots(hostname) {
  var end = hostname.length;

  while (end > 0 && hostname.charAt(end - 1) === '.') {
    end--;
  }

  return end === hostname.length ? hostname : hostname.slice(0, end);
}

function normalizeNoProxyHost(hostname) {
  if (!hostname) {
    return hostname;
  }

  if (hostname.charAt(0) === '[' && hostname.charAt(hostname.length - 1) === ']') {
    hostname = hostname.slice(1, -1);
  }

  hostname = stripTrailingDots(hostname);

  return normalizeIPv4MappedIPv6(hostname);
}

function ipv4ToBytes(hostname) {
  var octets = parseIPv4Octets(hostname);

  if (!octets) {
    return null;
  }

  return [Number(octets[0]), Number(octets[1]), Number(octets[2]), Number(octets[3])];
}

function pushIPv6Group(bytes, group) {
  if (!/^[0-9a-f]{1,4}$/.test(group)) {
    return false;
  }

  var value = parseInt(group, 16);

  bytes.push((value >> 8) & 0xff, value & 0xff);

  return true;
}

function ipv6ToBytes(hostname) {
  var halves = hostname.split('::');

  if (halves.length > 2) {
    return null;
  }

  var head = halves[0] ? halves[0].split(':') : [];
  var tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  var groups = tail.length ? tail : head;

  // Expand a trailing dotted-quad tail such as ::ffff:127.0.0.1 into two groups.
  if (groups.length && groups[groups.length - 1].indexOf('.') !== -1) {
    var quad = ipv4ToBytes(groups[groups.length - 1]);

    if (!quad) {
      return null;
    }

    groups.pop();
    groups.push((((quad[0] << 8) | quad[1]) >>> 0).toString(16));
    groups.push((((quad[2] << 8) | quad[3]) >>> 0).toString(16));
  }

  var headBytes = [];
  var tailBytes = [];
  var i;

  for (i = 0; i < head.length; i++) {
    if (!pushIPv6Group(headBytes, head[i])) {
      return null;
    }
  }

  for (i = 0; i < tail.length; i++) {
    if (!pushIPv6Group(tailBytes, tail[i])) {
      return null;
    }
  }

  var missing = 16 - headBytes.length - tailBytes.length;

  if (halves.length === 2 ? missing < 0 : missing !== 0) {
    return null;
  }

  for (i = 0; i < missing; i++) {
    headBytes.push(0);
  }

  return headBytes.concat(tailBytes);
}

function hostToBytes(hostname) {
  return hostname.indexOf(':') !== -1 ? ipv6ToBytes(hostname) : ipv4ToBytes(hostname);
}

// Parses a CIDR-form no_proxy entry such as 10.0.0.0/8 or [fd00::]/8.
// Returns null for anything that is not a well-formed network range so the
// caller can fall back to hostname matching.
//
// Range entries are matched on address alone. Unlike host entries they carry no
// port, because a trailing `:port` leaves a prefix that is not a bare number and
// so falls back to hostname matching, which will not match a range.
//
// An IPv4-mapped IPv6 host is normalised to its IPv4 form before it reaches
// here, so list those addresses as IPv4 ranges (10.0.0.0/8), not as
// ::ffff:0:0/96, which will not match.
function parseCIDREntry(entry) {
  var slashIndex = entry.indexOf('/');

  if (slashIndex === -1) {
    return null;
  }

  var prefixText = entry.slice(slashIndex + 1);

  if (!/^\d{1,3}$/.test(prefixText)) {
    return null;
  }

  var host = entry.slice(0, slashIndex);

  if (host.charAt(0) === '[' && host.charAt(host.length - 1) === ']') {
    host = host.slice(1, -1);
  }

  var bytes = hostToBytes(host);

  if (!bytes) {
    return null;
  }

  var prefix = parseInt(prefixText, 10);

  if (prefix > bytes.length * 8) {
    return null;
  }

  return [bytes, prefix];
}

function isInCIDR(hostname, cidr) {
  var networkBytes = cidr[0];
  var prefix = cidr[1];
  var bytes = hostToBytes(hostname);

  if (!bytes || bytes.length !== networkBytes.length) {
    return false;
  }

  var index = 0;
  var remaining = prefix;

  while (remaining >= 8) {
    if (bytes[index] !== networkBytes[index]) {
      return false;
    }

    remaining -= 8;
    index++;
  }

  if (remaining > 0) {
    var mask = (0xff << (8 - remaining)) & 0xff;

    if ((bytes[index] & mask) !== (networkBytes[index] & mask)) {
      return false;
    }
  }

  return true;
}

// Deliberately more permissive than parseIPv4Octets: this only asks whether the
// first octet is exactly 127, and a leading zero in any later octet cannot
// change that answer, so a hand-written no_proxy entry like 127.000.000.001
// still resolves to loopback.
function isLoopbackIPv4(hostname) {
  var octets = hostname.split('.');

  if (octets.length !== 4) {
    return false;
  }

  if (octets[0] !== '127') {
    return false;
  }

  return octets.every(function testOctet(octet) {
    return /^\d+$/.test(octet) && Number(octet) >= 0 && Number(octet) <= 255;
  });
}

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0' || isLoopbackIPv4(hostname);
}

module.exports = function shouldBypassProxy(location) {
  var parsed;

  try {
    parsed = new URL(location);
  } catch (err) {
    return false;
  }

  var noProxy = (process.env.no_proxy || process.env.NO_PROXY || '').toLowerCase();

  if (!noProxy) {
    return false;
  }

  if (noProxy === '*') {
    return true;
  }

  var protocol = parsed.protocol.split(':', 1)[0];
  var port = parsed.port !== '' ? parseInt(parsed.port, 10) : (DEFAULT_PORTS[protocol] || 0);
  var hostname = normalizeNoProxyHost(parsed.hostname.toLowerCase());

  return noProxy.split(/[\s,]+/).some(function testNoProxyEntry(entry) {
    if (!entry) {
      return false;
    }

    var cidr = parseCIDREntry(entry);

    if (cidr) {
      return isInCIDR(hostname, cidr);
    }

    var entryParts = parseNoProxyEntry(entry);
    var entryHost = normalizeNoProxyHost(entryParts[0]);
    var entryPort = entryParts[1];

    if (entryHost === '*') {
      return true;
    }

    if (!entryHost) {
      return false;
    }

    if (entryPort && entryPort !== port) {
      return false;
    }

    if (isLoopbackHost(hostname) && isLoopbackHost(entryHost)) {
      return true;
    }

    if (entryHost.charAt(0) === '*') {
      entryHost = entryHost.slice(1);
    }

    if (entryHost.charAt(0) === '.') {
      return hostname.slice(-entryHost.length) === entryHost;
    }

    return hostname === entryHost;
  });
};
