import { describe, it, expect } from 'vitest';
import buildFullPath from '../../../lib/core/buildFullPath.js';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('core::buildFullPath', () => {
  it('combines URLs when the requested URL is relative', () => {
    expect(buildFullPath('https://api.github.com', '/users')).toBe('https://api.github.com/users');
  });

  it('does not combine URLs when the requested URL is absolute', () => {
    expect(buildFullPath('https://api.github.com', 'https://api.example.com/users')).toBe(
      'https://api.example.com/users'
    );
  });

  it('combines URLs when requested URL is absolute and allowAbsoluteUrls is false', () => {
    expect(buildFullPath('https://api.github.com', 'https://api.example.com/users', false)).toBe(
      'https://api.github.com/https://api.example.com/users'
    );
  });

  it('does not combine URLs when baseURL is missing and allowAbsoluteUrls is false', () => {
    expect(buildFullPath(undefined, 'https://api.example.com/users', false)).toBe(
      'https://api.example.com/users'
    );
  });

  it('does not combine URLs when baseURL is not configured', () => {
    expect(buildFullPath(undefined, '/users')).toBe('/users');
  });

  it('combines URLs when baseURL and requested URL are both relative', () => {
    expect(buildFullPath('/api', '/users')).toBe('/api/users');
  });

  it('rejects HTTP URLs missing slashes after the protocol', () => {
    for (const call of [
      () => buildFullPath(undefined, 'https:example.com/users'),
      () => buildFullPath(undefined, '\thttps:example.com/users'),
      () => buildFullPath(undefined, '\u0000https:example.com/users'),
      () => buildFullPath(undefined, 'h\nttp:example.com/users'),
      () => buildFullPath(undefined, 'ht\ttp:example.com/users'),
      () => buildFullPath(undefined, 'htt\rp:example.com/users'),
      () => buildFullPath(undefined, 'http:/example.com/users'),
      () => buildFullPath('http:example.com/api', '/users'),
    ]) {
      let error;
      try {
        call();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AxiosError);
      expect(error.code).toBe(AxiosError.ERR_INVALID_URL);
      expect(error.message).toMatch(/^Invalid URL ".*": missing "\/\/" after protocol$/);
    }
  });

  it('includes the offending URL in the error message', () => {
    let error;

    try {
      buildFullPath(undefined, 'https:example.com/users');
    } catch (err) {
      error = err;
    }

    expect(error.message).toBe('Invalid URL "https:example.com/users": missing "//" after protocol');
  });

  it('reports the control-character-normalized URL for a leading control character', () => {
    let error;

    try {
      buildFullPath(undefined, '\thttps:example.com/users');
    } catch (err) {
      error = err;
    }

    expect(error.message).toBe('Invalid URL "https:example.com/users": missing "//" after protocol');
  });

  it('reports the control-character-normalized URL for an interior control character', () => {
    let error;

    try {
      buildFullPath(undefined, 'h\nttp:example.com/users');
    } catch (err) {
      error = err;
    }

    expect(error.message).toBe('Invalid URL "http:example.com/users": missing "//" after protocol');
  });

  it('redacts credentials and query/fragment values while keeping the URL identifiable', () => {
    let error;

    try {
      buildFullPath(
        undefined,
        'https:admin:hunter2@api.example.com/v1?apikey=topsecret&id=42#token=xyz&opaque'
      );
    } catch (err) {
      error = err;
    }

    expect(error.message).toBe(
      'Invalid URL "https:[REDACTED ****]@api.example.com/v1?apikey=[REDACTED ****]&id=[REDACTED ****]#token=[REDACTED ****]&[REDACTED ****]": missing "//" after protocol'
    );
    // Credentials and parameter values must not leak.
    for (const secret of ['admin', 'hunter2', 'topsecret', '42', 'xyz', 'opaque']) {
      expect(error.message).not.toContain(secret);
    }
    // Non-sensitive structure stays intact so the request is still identifiable.
    for (const kept of ['api.example.com', '/v1', 'apikey', 'id', 'token']) {
      expect(error.message).toContain(kept);
    }
  });

  it('does not reject an unused malformed baseURL for absolute requests', () => {
    expect(buildFullPath('http:example.com/api', 'https://api.example.com/users')).toBe(
      'https://api.example.com/users'
    );
  });

  it('rejects a malformed baseURL when absolute requests are forced through baseURL', () => {
    let error;

    try {
      buildFullPath('http:example.com/api', 'https://api.example.com/users', false);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(AxiosError);
    expect(error.code).toBe(AxiosError.ERR_INVALID_URL);
    expect(error.message).toBe('Invalid URL "http:example.com/api": missing "//" after protocol');
  });
});
