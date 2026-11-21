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

  it('should not insert slash before a query or fragment only relative url', () => {
    expect(combineURLs('https://api.github.com/users', '?page=2')).toBe(
      'https://api.github.com/users?page=2'
    );
    expect(combineURLs('https://api.github.com/users/', '?page=2')).toBe(
      'https://api.github.com/users/?page=2'
    );
    expect(combineURLs('https://api.github.com/users', '#top')).toBe(
      'https://api.github.com/users#top'
    );
  });

  it('should allow a single slash for relative url', () => {
    expect(combineURLs('https://api.github.com/users', '/')).toBe('https://api.github.com/users/');
  });
});
