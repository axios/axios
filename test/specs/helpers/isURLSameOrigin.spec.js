describe('helpers::isURLSameOrigin', function () {
  describe('standard browser envs', function () {
    var isURLSameOrigin;

    beforeAll(function() {
      delete require.cache[require.resolve('../../../lib/helpers/isURLSameOrigin')];
      isURLSameOrigin = require('../../../lib/helpers/isURLSameOrigin');
    });

    it('should detect same origin', function () {
      expect(isURLSameOrigin(window.location.href)).toEqual(true);
    });

    it('should detect different origin', function () {
      expect(isURLSameOrigin('https://github.com/axios/axios')).toEqual(false);
    });
  });

  describe('non standard browser envs', function () {
    var isURLSameOrigin;

    beforeAll(function() {
      delete require.cache[require.resolve('../../../lib/helpers/isURLSameOrigin')];
      navigator.product = 'ReactNative';
      isURLSameOrigin = require('../../../lib/helpers/isURLSameOrigin');
    });

    afterAll(function() {
      navigator.product = undefined;
    });

    it('should always return true', function () {
      expect(isURLSameOrigin('https://github.com/axios/axios')).toEqual(true);
    });
  });
});
