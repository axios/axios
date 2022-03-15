var isCancel = require('../../../lib/cancel/isCancel');
var CanceledError = require('../../../lib/cancel/CanceledError');

describe('isCancel', function() {
  it('returns true if value is a CanceledError', function() {
    expect(isCancel(new CanceledError())).toBe(true);
  });

  it('returns false if value is not a CanceledError', function() {
    expect(isCancel({ foo: 'bar' })).toBe(false);
  });
});
