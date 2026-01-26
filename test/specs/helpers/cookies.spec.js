import cookies from '../../../lib/helpers/cookies';

describe('helpers::cookies', function () {
  afterEach(function () {
    // Remove all the cookies
    const expires = Date.now() - (60 * 60 * 24 * 7);
    document.cookie.split(';').map(function (cookie) {
      return cookie.split('=')[0];
    }).forEach(function (name) {
      document.cookie = name + '=; expires=' + new Date(expires).toGMTString();
    });
  });

  it('should write cookies', function () {
    cookies.write('foo', 'baz');
    expect(document.cookie).toEqual('foo=baz');
  });

  it('should read cookies', function () {
    cookies.write('foo', 'abc');
    cookies.write('bar', 'def');
    expect(cookies.read('foo')).toEqual('abc');
    expect(cookies.read('bar')).toEqual('def');
  });

  it('should remove cookies', function () {
    cookies.write('foo', 'bar');
    cookies.remove('foo');
    expect(cookies.read('foo')).toEqual(null);
  });

  it('should uri encode values', function () {
    cookies.write('foo', 'bar baz%');
    expect(document.cookie).toEqual('foo=bar%20baz%25');
  });
});
