var spread = require('../../../lib/helpers/spread');

describe('helpers::spread', function () {
  it('should spread array to arguments', function () {
    var value = 0;
    spread(function (a, b) {
      value = a * b;
    })([5, 10]);

    expect(value).toEqual(50);
  });

  it('should return callback result', function () {
    var value = spread(function (a, b) {
      return a * b;
    })([5, 10]);

    expect(value).toEqual(50);
  });
});

