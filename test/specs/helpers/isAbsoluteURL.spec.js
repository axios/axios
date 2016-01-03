var isAbsoluteURL = require('../../../lib/helpers/isAbsoluteURL');

describe('helpers::isAbsoluteURL', function () {
  it('should return true if URL begins with valid scheme name', function () {
    expect(isAbsoluteURL('https://api.github.com/users')).toBe(true);
    expect(isAbsoluteURL('custom-scheme-v1.0://example.com/')).toBe(true);
    expect(isAbsoluteURL('HTTP://example.com/')).toBe(true);
  });

  it('should return false if URL begins with invalid scheme name', function () {
    expect(isAbsoluteURL('123://example.com/')).toBe(false);
    expect(isAbsoluteURL('!valid://example.com/')).toBe(false);
  });

  it('should return true if URL is protocol-relative', function () {
    expect(isAbsoluteURL('//example.com/')).toBe(true);
  });

  it('should return false if URL is relative', function () {
    expect(isAbsoluteURL('/foo')).toBe(false);
    expect(isAbsoluteURL('foo')).toBe(false);
  });
});
