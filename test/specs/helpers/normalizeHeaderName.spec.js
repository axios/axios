var normalizeHeaderName = require('../../../lib/helpers/normalizeHeaderName');

describe('helpers::normalizeHeaderName', () => {
  it('should normalize matching header name', () => {
    var headers = {
      'conTenT-Type': 'foo/bar',
    };
    normalizeHeaderName(headers, 'Content-Type');
    expect(headers['Content-Type']).toBe('foo/bar');
    expect(headers['conTenT-Type']).toBeUndefined();
  });

  it('should not change non-matching header name', () => {
    var headers = {
      'content-type': 'foo/bar',
    };
    normalizeHeaderName(headers, 'Content-Length');
    expect(headers['content-type']).toBe('foo/bar');
    expect(headers['Content-Length']).toBeUndefined();
  });
});
