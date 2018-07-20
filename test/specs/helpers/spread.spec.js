var spread = require('../../../lib/helpers/spread');

describe('helpers::spread', () => {
  it('should spread array to arguments', () => {
    var value = 0;
    spread((a, b) => {
      value = a * b;
    })([5, 10]);

    expect(value).toEqual(50);
  });

  it('should return callback result', () => {
    var value = spread((a, b) => a * b)([5, 10]);

    expect(value).toEqual(50);
  });
});

