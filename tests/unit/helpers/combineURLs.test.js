import { describe, it, expect } from 'vitest';
import combineURLs from '../../../lib/helpers/combineURLs.js';

describe('helpers::combineURLs', () => {
  it('should combine URLs', () => {
    expect(combineURLs('https://api.github.com', '/users')).toBe('https://api.github.com/users');
  });

  it('should remove duplicate slashes', () => {
    expect(combineURLs('https://api.github.com/', '/users')).toBe('https://api.github.com/users');
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

  it('should not insert a slash before a query-only relative url', () => {
    expect(combineURLs('https://api.github.com/users', '?page=2')).toBe(
      'https://api.github.com/users?page=2'
    );
  });

  it('should not insert a slash before a hash-only relative url', () => {
    expect(combineURLs('https://api.github.com/users', '#profile')).toBe(
      'https://api.github.com/users#profile'
    );
  });
});
