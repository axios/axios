import {kindOfTest} from '../../../lib/utils';

describe('utils::kindOfTest', function () {
  it('should return true if the type is matched', function () {
    const test = kindOfTest('number');

    expect(test(123)).toEqual(true);
    expect(test('123')).toEqual(false);
  });
});
