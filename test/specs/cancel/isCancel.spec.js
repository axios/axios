var isCancel = require('../../../lib/cancel/isCancel');
var Cancel = require('../../../lib/cancel/Cancel');

describe('isCancel', () => {
  it('returns true if value is a Cancel', () => {
    expect(isCancel(new Cancel())).toBe(true);
  });

  it('returns false if value is not a Cancel', () => {
    expect(isCancel({ foo: 'bar' })).toBe(false);
  });
});
