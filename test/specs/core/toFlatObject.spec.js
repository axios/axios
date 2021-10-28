var toFlatConfig = require('../../../lib/core/toFlatConfig');

describe('core::toFlatObject', function() {
  it('should resolve prototype based config to a flat config object', function() {
    var config1 = {
      x: 1,
      o1: {
        x: 11
      },
      a: [1, 2]
    };

    var config2 = Object.assign(Object.create(config1), {
      y: 2,
      o1: {
        y: 22
      }
    });

    var config3 = Object.assign(Object.create(config2), {
      z: 3,
      x: 4,
      o1: {
        x: 33
      },
      a: [3, 4]
    });

    var flatConfig = toFlatConfig(config3);

    expect(flatConfig).toEqual({
      x: 4,
      y: 2,
      z: 3,
      o1: {
        x: 33,
        y: 22
      },
      a: [3, 4]
    });
  });
});
