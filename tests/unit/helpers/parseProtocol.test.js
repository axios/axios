import { describe, it, expect } from 'vitest';
import parseProtocol from '../../../lib/helpers/parseProtocol.js';

describe('helpers::parseProtocol', () => {
  it('should parse http protocol', () => {
    expect(parseProtocol('http://example.com')).toEqual('http');
  });

  it('should parse https protocol', () => {
    expect(parseProtocol('https://example.com')).toEqual('https');
  });

  it('should parse ftp protocol', () => {
    expect(parseProtocol('ftp://files.example.com')).toEqual('ftp');
  });

  it('should parse protocols with + character', () => {
    expect(parseProtocol('coap+tcp://example.com')).toEqual('coap+tcp');
  });

  it('should parse protocols with - character', () => {
    expect(parseProtocol('coap-tcp://example.com')).toEqual('coap-tcp');
  });

  it('should parse data URIs', () => {
    expect(parseProtocol('data:text/plain;base64,SGVsbG8=')).toEqual('data');
  });

  it('should parse file protocol', () => {
    expect(parseProtocol('file:///path/to/file')).toEqual('file');
  });

  it('should return empty string for URLs without protocol', () => {
    expect(parseProtocol('/relative/path')).toEqual('');
  });

  it('should return empty string for empty string', () => {
    expect(parseProtocol('')).toEqual('');
  });

  it('should return empty string for protocol-like strings exceeding 25 chars', () => {
    const longProtocol = 'a'.repeat(26) + '://example.com';
    expect(parseProtocol(longProtocol)).toEqual('');
  });

  it('should handle protocol names up to 25 characters', () => {
    const maxProtocol = 'a'.repeat(25);
    expect(parseProtocol(maxProtocol + '://example.com')).toEqual(maxProtocol);
  });
});
