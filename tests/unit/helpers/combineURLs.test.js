import { describe, it, expect } from 'vitest';
import combineURLs from '../../../lib/helpers/combineURLs.js';

describe('helpers::combineURLs', () => {
  it('should combine URLs', () => {
    expect(combineURLs('https://api.github.com', '/users')).toBe('https://api.github.com/users');
  });

  it('should remove duplicate slashes', () => {
    expect(combineURLs('https://api.github.com/', '/users')).toBe('https://api.github.com/users');
  });

  it('should remove multiple trailing slashes from the base URL', () => {
    expect(combineURLs('https://api.github.com///', '/users')).toBe('https://api.github.com/users');
  });

  it('should insert missing slash', () => {
    expect(combineURLs('https://api.github.com', 'users')).toBe('https://api.github.com/users');
  });

  it('should not insert slash when relative url missing/empty', () => {
    expect(combineURLs('https://api.github.com/users', '')).toBe('https://api.github.com/users');
  });

  it('should allow a single slash for relative url', () => {
    expect(combineURLs('https://api.github.com/users', '/')).toBe('https://api.github.com/users/');
  });

  it('should return relative URL when baseURL is undefined', () => {
    expect(combineURLs(undefined, '/users')).toBe('users');
  });

  it('should return relative URL when baseURL is null', () => {
    expect(combineURLs(null, '/users')).toBe('users');
  });

  it('should return relative URL when baseURL is empty string', () => {
    expect(combineURLs('', '/users')).toBe('users');
  });

  it('should return empty string when both are missing', () => {
    expect(combineURLs(undefined, '')).toBe('');
    expect(combineURLs(null, null)).toBe('');
  });

  it('should preserve relative URL without leading slash when base is missing', () => {
    expect(combineURLs(undefined, 'users')).toBe('users');
  });
});
