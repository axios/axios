var isURLSameOrigin = require('../../../lib/helpers/isURLSameOrigin');

describe('helpers::isURLSameOrigin', () => {
  it('should detect same origin', () => {
    expect(isURLSameOrigin(window.location.href)).toEqual(true);
  });

  it('should detect different origin', () => {
    expect(isURLSameOrigin('https://github.com/axios/axios')).toEqual(false);
  });
});
