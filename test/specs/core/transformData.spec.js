var transformData = require('../../../lib/core/transformData');

describe('core::transformData', () => {
  it('should support a single transformer', () => {
    var data;
    data = transformData(data, null, data => {
      data = 'foo';
      return data;
    });

    expect(data).toEqual('foo');
  });

  it('should support an array of transformers', () => {
    var data = '';
    data = transformData(data, null, [data => {
      data += 'f';
      return data;
    }, data => {
      data += 'o';
      return data;
    }, data => {
      data += 'o';
      return data;
    }]);

    expect(data).toEqual('foo');
  });
});

