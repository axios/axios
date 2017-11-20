var normalizeHeaderName = require('../../../lib/helpers/normalizeHeaderName');

describe('helpers::normalizeHeaderName', function () {
  it('should normalize matching header name', function () {
    var headers = {
      'conTenT-Type': 'foo/bar',
    };
    normalizeHeaderName(headers, 'Content-Type');
    expect(headers['Content-Type']).toBe('foo/bar');
    expect(headers['conTenT-Type']).toBeUndefined();
  });

  it('should not change non-matching header name', function () {
    var headers = {
      'content-type': 'foo/bar',
    };
    normalizeHeaderName(headers, 'Content-Length');
    expect(headers['content-type']).toBe('foo/bar');
    expect(headers['Content-Length']).toBeUndefined();
  });

  it('should not fail on name.toUpperCase when headers value ain\'t object', function () {
    var headers = 'NotAnObject'
    var normalizer = function () { normalizeHeaderName(headers, 'Content-Length'); };
    expect(normalizer).toThrow(new TypeError('expecting "headers" to be an object'));
  });
});
