var cookies = require('../../../lib/helpers/cookies');

describe('helpers::cookies', () => {
  afterEach(() => {
    // Remove all the cookies
    var expires = Date.now() - (60 * 60 * 24 * 7);
    document.cookie.split(';').map(cookie => cookie.split('=')[0]).forEach(name => {
      document.cookie = name + '=; expires=' + new Date(expires).toGMTString();
    });
  });

  it('should write cookies', () => {
    cookies.write('foo', 'baz');
    expect(document.cookie).toEqual('foo=baz');
  });

  it('should read cookies', () => {
    cookies.write('foo', 'abc');
    cookies.write('bar', 'def');
    expect(cookies.read('foo')).toEqual('abc');
    expect(cookies.read('bar')).toEqual('def');
  });

  it('should remove cookies', () => {
    cookies.write('foo', 'bar');
    cookies.remove('foo');
    expect(cookies.read('foo')).toEqual(null);
  });

  it('should uri encode values', () => {
    cookies.write('foo', 'bar baz%');
    expect(document.cookie).toEqual('foo=bar%20baz%25');
  });
});
