import utils from '../../../lib/utils';

const {toFlatObject} = utils;

describe('utils::toFlatObject', function () {
  it('should resolve object proto chain to a flat object representation', function () {
    const a = {x: 1};
    const b = Object.create(a, {y: {value: 2}});
    const c = Object.create(b, {z: {value: 3}});
    expect(toFlatObject(c)).toEqual({x: 1, y: 2, z: 3});
  });
});
