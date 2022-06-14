import transformData from '../../../lib/core/transformData';

describe('core::transformData', function () {
  it('should support a single transformer', function () {
    let data;

    data = transformData.call({

    }, function (data) {
      data = 'foo';
      return data;
    })

    expect(data).toEqual('foo');
  });

  it('should support an array of transformers', function () {
    let data = '';
    data = transformData.call({data}, [function (data) {
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

  it('should support reference headers in transformData', function () {
    const headers = {
      'content-type': 'foo/bar',
    };
    let data = '';
    data = transformData.call({data, headers}, [function (data, headers) {
      data += headers['content-type'];
      return data;
    }]);

    expect(data).toEqual('foo/bar');
  });

  it('should support reference status code in transformData', function () {
    let data = '';
    data = transformData.call({}, [function (data, headers, status) {
      data += status;
      return data;
    }], {data, status: 200});

    expect(data).toEqual('200');
  });
});

