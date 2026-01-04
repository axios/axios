import parseProtocol from '../../../lib/helpers/parseProtocol.js';

// Minimal expect helper for browser testing
function expect(actual) {
  return {
    toEqual(expected) {
      if (actual !== expected) {
        throw new Error(`Expected "${expected}", but got "${actual}"`);
      }
    },
    toThrow() {
      let threw = false;
      try {
        actual();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error(`Expected function to throw`);
      }
    }
  };
}

describe('helpers::parseProtocol', function () {
  it('should parse protocol part if it exists', function () {
    expect(parseProtocol('http://example.com')).toEqual('http');
    expect(parseProtocol('https://example.com')).toEqual('https');
    expect(parseProtocol('ftp://example.com')).toEqual('ftp');
    expect(parseProtocol('ws://example.com')).toEqual('ws');
    expect(parseProtocol('wss://example.com')).toEqual('wss');

    expect(parseProtocol('ftp:google.com')).toEqual('ftp');
    expect(parseProtocol('custom+protocol://example.com')).toEqual('custom+protocol');

    expect(parseProtocol('//google.com')).toEqual('');
    expect(parseProtocol('')).toEqual('');
    expect(parseProtocol('data:text/plain,Hello')).toEqual('data');
    expect(parseProtocol('data:application/octet-stream;base64,MTIz')).toEqual('data');
  });

  it('should handle invalid inputs', function () {
    expect(() => parseProtocol(null)).toThrow();
    expect(() => parseProtocol(undefined)).toThrow();
    expect(() => parseProtocol(123)).toThrow();
    expect(() => parseProtocol({})).toThrow();
  });
});
