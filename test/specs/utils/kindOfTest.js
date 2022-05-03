var kindOf = require('../../../lib/utils').kindOf;

describe('utils::kindOf', function () {
  it('should return object tag', function () {
    expect(kindOf({})).toEqual('object');
    // cached result
    expect(kindOf({})).toEqual('object');
    expect(kindOf([])).toEqual('array');
  });
});
