describe('helpers::cookies', function () {

  afterEach(function () {
    // Remove all the cookies
    var expires = Date.now() - (60 * 60 * 24 * 7);
    document.cookie.split(';').map(function (cookie) {
      return cookie.split('=')[0];
    }).forEach(function (name) {
      document.cookie = name + '=; expires=' + new Date(expires).toGMTString();
    });
  });

  describe('standard browser envs', function () {
    var cookies;

    beforeAll(function() {
      delete require.cache[require.resolve('../../../lib/helpers/cookies')];
      cookies = require('../../../lib/helpers/cookies');
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

  describe('non standard browser envs', function () {
    var cookies;

    beforeAll(function() {
      delete require.cache[require.resolve('../../../lib/helpers/cookies')];
      navigator.product = 'ReactNative';
      cookies = require('../../../lib/helpers/cookies');
    });

    afterAll(function() {
      navigator.product = undefined;
    });

    it('should not write cookies', function () {
      cookies.write('foo', 'baz');
      expect(document.cookie).toEqual('');
    });

    it('should always return null when read() is executed', function () {
      cookies.write('foo', 'abc');
      expect(cookies.read('foo')).toEqual(null);
      expect(cookies.read('bar')).toEqual(null);
    });

    it('should do nothing when remove() is executed', function () {
      document.cookie = 'foo=bar';
      cookies.remove('foo');
      expect(document.cookie).toEqual('foo=bar');
    });
  });
});
