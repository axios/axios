var toFormData = require('../../../lib/helpers/toFormData');

describe('toFormData', function () {
  it('should convert nested data object to FormData with dots option enabled', function () {
    var o = {
      val: 123,
      nested: {
        arr: ['hello', 'world']
      }
    };

    var form = toFormData(o, null, {dots: true});
    expect(form instanceof FormData).toEqual(true);
    expect(Array.from(form.keys()).length).toEqual(3);
    expect(form.get('val')).toEqual('123');
    expect(form.get('nested.arr.0')).toEqual('hello');
  });

  it('should respect metaTokens option', function () {
    var data = {
      'obj{}': {x: 1, y: 2}
    };

    var str = JSON.stringify(data['obj{}']);

    var form = toFormData(data, null, {metaTokens: false});

    expect(Array.from(form.keys()).length).toEqual(1);
    expect(form.getAll('obj')).toEqual([str]);
  });

  describe('Flat arrays serialization', function () {
    it('should include full indexes when the `indexes` option is set to true', function () {
      var data = {
        arr: [1, 2, 3],
        arr2: [1, [2], 3]
      };

      var form = toFormData(data, null, {indexes: true});

      expect(Array.from(form.keys()).length).toEqual(6);

      expect(form.get('arr[0]')).toEqual('1');
      expect(form.get('arr[1]')).toEqual('2');
      expect(form.get('arr[2]')).toEqual('3');

      expect(form.get('arr2[0]')).toEqual('1');
      expect(form.get('arr2[1][0]')).toEqual('2');
      expect(form.get('arr2[2]')).toEqual('3');
    });

    it('should include brackets only when the `indexes` option is set to false', function () {
      var data = {
        arr: [1, 2, 3],
        arr2: [1, [2], 3]
      };

      var form = toFormData(data, null, {indexes: false});

      expect(Array.from(form.keys()).length).toEqual(6);

      expect(form.getAll('arr[]')).toEqual(['1', '2', '3']);

      expect(form.get('arr2[0]')).toEqual('1');
      expect(form.get('arr2[1][0]')).toEqual('2');
      expect(form.get('arr2[2]')).toEqual('3');
    });

    it('should omit brackets when the `indexes` option is set to null', function () {
      var data = {
        arr: [1, 2, 3],
        arr2: [1, [2], 3]
      };

      var form = toFormData(data, null, {indexes: null});

      expect(Array.from(form.keys()).length).toEqual(6);

      expect(form.getAll('arr')).toEqual(['1', '2', '3']);

      expect(form.get('arr2[0]')).toEqual('1');
      expect(form.get('arr2[1][0]')).toEqual('2');
      expect(form.get('arr2[2]')).toEqual('3');
    });
  });

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
    expect(form.get('nested[arr][0]')).toEqual('hello');
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

