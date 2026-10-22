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

  it('should return the relative url when the base url is not set', () => {
    expect(combineURLs(undefined, '/users')).toBe('/users');
    expect(combineURLs(null, 'users')).toBe('users');
  });

  it('should keep the empty-string base behavior unchanged', () => {
    expect(combineURLs('', 'users')).toBe('/users');
    expect(combineURLs('', undefined)).toBe('');
  });
});
