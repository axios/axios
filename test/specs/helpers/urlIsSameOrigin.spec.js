var urlIsSameOrigin = require('../../../lib/helpers/urlIsSameOrigin');

describe('helpers::urlIsSameOrigin', function () {
  it('should detect same origin', function () {
    expect(urlIsSameOrigin(window.location.href)).toEqual(true);
  });

  it('should detect different origin', function () {
    expect(urlIsSameOrigin('https://github.com/mzabriskie/axios')).toEqual(false);
  });
});
