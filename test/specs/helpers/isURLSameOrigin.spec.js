import isURLSameOrigin from '../../../lib/helpers/isURLSameOrigin';

describe('helpers::isURLSameOrigin', function () {
  it('should detect same origin', function () {
    expect(isURLSameOrigin(window.location.href)).toEqual(true);
  });
  it('should detect different origin', function () {
    expect(isURLSameOrigin('https://github.com/axios/axios')).toEqual(false);
  });
  it('should gracefully handle invalid arguments', () => {
    const allFalse = [
      // isURLSameOrigin("github.com/axios/axios"),
      isURLSameOrigin(null),
      isURLSameOrigin(false),
      isURLSameOrigin(5),
      isURLSameOrigin([]),
      isURLSameOrigin({}),
    ]
    allFalse.forEach((val) => {
      expect(val).toEqual(false);
    });
  });
});
