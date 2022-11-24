import getIsURLSameOriginFn from '../../../lib/helpers/isURLSameOrigin';
import platform from  '../../../lib/platform';
const isStandardBrowserEnv = platform.isStandardBrowserEnv();

describe('helpers::isURLSameOrigin', function () {
  it('should detect same origin', function () {
    expect(getIsURLSameOriginFn(isStandardBrowserEnv)(window.location.href)).toEqual(true);
  });

  it('should detect different origin', function () {
    expect(getIsURLSameOriginFn(isStandardBrowserEnv)('https://github.com/axios/axios')).toEqual(false);
  });
});
