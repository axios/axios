var combineURLs = require('../../../lib/helpers/combineURLs');

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
});
