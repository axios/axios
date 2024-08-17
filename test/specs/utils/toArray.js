import utils from '../../../lib/utils';

const {toArray} = utils;

describe('utils::kindOf', function () {
  it('should return object tag', function () {
    expect(toArray()).toEqual(null);
    expect(toArray([])).toEqual([]);
    expect(toArray([1])).toEqual([1]);
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
