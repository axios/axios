var combineURLs = require('../../../lib/helpers/combineURLs');

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
});
