var kindOfTest = require('../../../lib/utils').kindOfTest;

describe('utils::endsWith', function () {
  it('should return true if the string ends with passed substring', function () {
    var test = kindOfTest('number');

    expect(test(123)).toEqual(true);
    expect(test('123')).toEqual(false);
  });
});
