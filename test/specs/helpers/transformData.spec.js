var transformData = require('../../../lib/helpers/transformData');

describe('helpers::transformData', function () {
  it('should support a single transformer', function () {
    var data;
    data = transformData(data, null, function (data) {
      data = 'foo';
      return data;
    });

    expect(data).toEqual('foo');
  });

  it('should support an array of transformers', function () {
    var data = '';
    data = transformData(data, null, [function (data) {
      data += 'f';
      return data;
    }, function (data) {
      data += 'o';
      return data;
    }, function (data) {
      data += 'o';
      return data;
    }]);

    expect(data).toEqual('foo');
  });
});

