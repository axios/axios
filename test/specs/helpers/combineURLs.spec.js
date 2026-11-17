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

  it('should not insert slash when relative url missing/empty', function () {
    expect(combineURLs('https://api.github.com/users', '')).toBe('https://api.github.com/users');
  });

  it('should allow a single slash for relative url', function () {
    expect(combineURLs('https://api.github.com/users', '/')).toBe('https://api.github.com/users/');
  });

  it('should keep the result on the current origin when the base URL is only slashes', function () {
    var bases = ['/', '//', '///'];
    var relativeURLs = [
      'users',
      '/users',
      '//evil.example/users',
      '\\\\evil.example/users',
      '/\\evil.example/users',
      '\\/evil.example/users',
      '\t/evil.example/users',
      '/\t/evil.example/users',
      '\n//evil.example/users',
      '\r\n/evil.example/users'
    ];

    bases.forEach(function (base) {
      relativeURLs.forEach(function (relativeURL) {
        var combined = combineURLs(base, relativeURL);
        var resolved = new URL(combined, 'https://app.example/page');

        expect(resolved.host).toBe('app.example');
        expect(combined.charAt(0)).toBe('/');
        expect(combined.charAt(1)).not.toBe('/');
      });
    });
  });

  it('should combine a slash-only base URL with a relative URL as a root path', function () {
    expect(combineURLs('/', 'users')).toBe('/users');
    expect(combineURLs('/', '/users')).toBe('/users');
    expect(combineURLs('//', '//users')).toBe('/users');
    expect(combineURLs('/', '\\\\evil.example/users')).toBe('/evil.example/users');
    expect(combineURLs('/', '\t/evil.example/users')).toBe('/evil.example/users');
  });

  it('should leave relative URLs untouched for a base URL with a path', function () {
    expect(combineURLs('/api', '\\users')).toBe('/api/\\users');
    expect(combineURLs('https://api.github.com/', '\t/users')).toBe('https://api.github.com/\t/users');
  });
});
