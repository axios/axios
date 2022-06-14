import combineURLs from '../../../lib/helpers/combineURLs';

describe('helpers::combineURLs', function () {
  it('should combine URLs', function () {
    expect(combineURLs('https://api.github.com', '/users')).toBe('https://api.github.com/users');
  });

  it('should remove duplicate slashes', function () {
    expect(combineURLs('https://api.github.com/', '/users')).toBe('https://api.github.com/users');
  });

  it('should insert missing slash', function () {
    expect(combineURLs('https://api.github.com', 'users')).toBe('https://api.github.com/users');
  });

  it('should not insert slash when relative url missing/empty', function () {
    expect(combineURLs('https://api.github.com/users', '')).toBe('https://api.github.com/users');
  });

  it('should allow a single slash for relative url', function () {
    expect(combineURLs('https://api.github.com/users', '/')).toBe('https://api.github.com/users/');
  });
});
