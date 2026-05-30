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

  it('should throw on malformed http protocol URLs missing //', () => {
    try {
      buildFullPath(undefined, 'https:google.com');
      expect.unreachable('Expected malformed URL to throw ERR_INVALID_URL');
    } catch (error) {
      expect(error.code).toBe(AxiosError.ERR_INVALID_URL);
      expect(error.message).toContain('did you mean "https://google.com"?');
    }
  });
});
