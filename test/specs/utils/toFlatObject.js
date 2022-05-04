var toFlatObject = require('../../../lib/utils').toFlatObject;

describe('utils::toFlatObject', function () {
  it('should resolve object proto chain to a flat object representation', function () {
    var a = {x: 1};
    var b = Object.create(a, {y: {value: 2}});
    var c = Object.create(b, {z: {value: 3}});
    expect(toFlatObject(c)).toEqual({x: 1, y: 2, z: 3});
  });
});
