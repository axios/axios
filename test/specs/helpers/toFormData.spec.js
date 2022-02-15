var toFormData = require('../../../lib/helpers/toFormData');

describe('toFormData', function () {
  it('should convert nested data object to FormData', function () {
    var o = {
      val: 123,
      nested: {
        arr: ['hello', 'world']
      }
    };

    var form = toFormData(o);
    expect(form instanceof FormData).toEqual(true);
    expect(Array.from(form.keys()).length).toEqual(3);
    expect(form.get('val')).toEqual('123');
    expect(form.get('nested.arr.0')).toEqual('hello');
  });

  it('should append value whose key ends with [] as separate values with the same key', function () {
    var data = {
      'arr[]': [1, 2, 3]
    };

    var form = toFormData(data);

    expect(Array.from(form.keys()).length).toEqual(3);
    expect(form.getAll('arr[]')).toEqual(['1', '2', '3']);
  });

  it('should append value whose key ends with {} as a JSON string', function () {
    var data = {
      'obj{}': {x: 1, y: 2}
    };

    var str = JSON.stringify(data['obj{}']);

    var form = toFormData(data);

    expect(Array.from(form.keys()).length).toEqual(1);
    expect(form.getAll('obj{}')).toEqual([str]);
  });
});

