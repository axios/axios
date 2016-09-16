var forEach = require('../../../lib/utils').forEach;

describe('utils::forEach', function () {
  it('should loop over an array', function () {
    var sum = 0;

    forEach([1, 2, 3, 4, 5], function (val) {
      sum += val;
    });

    expect(sum).toEqual(15);
  });

  it('should loop over object keys', function () {
    var keys = '';
    var vals = 0;
    var obj = {
      b: 1,
      a: 2,
      r: 3
    };

    forEach(obj, function (v, k) {
      keys += k;
      vals += v;
    });

    expect(keys).toEqual('bar');
    expect(vals).toEqual(6);
  });

  it('should handle undefined gracefully', function () {
    var count = 0;

    forEach(undefined, function () {
      count++;
    });

    expect(count).toEqual(0);
  });

  it('should make an array out of non-array argument', function () {
    var count = 0;

    forEach(function () {}, function () {
      count++;
    });

    expect(count).toEqual(1);
  });

  it('should handle non object prototype gracefully', function () {
    var count = 0;
    var data = Object.create(null);
    data.foo = 'bar'

    forEach(data, function () {
      count++;
    });

    expect(count).toEqual(1);
  });
});
