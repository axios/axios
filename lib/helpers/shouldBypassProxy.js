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

function normalizeNoProxyHost(hostname) {
  if (!hostname) {
    return hostname;
  }

  if (hostname.charAt(0) === '[' && hostname.charAt(hostname.length - 1) === ']') {
    hostname = hostname.slice(1, -1);
  }

  return hostname.replace(/\.+$/, '');
}

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
  return hostname === 'localhost' || hostname === '::1' || isLoopbackIPv4(hostname);
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
