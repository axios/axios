var toFormData = require('../../../lib/helpers/toFormData');
var AxiosError = require('../../../lib/core/AxiosError');
var AxiosURLSearchParams = require('../../../lib/helpers/AxiosURLSearchParams');

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

  // --- Depth limit tests ---

  function nest(depth) {
    var o = { leaf: 1 };
    for (var i = 0; i < depth; i++) o = { a: o };
    return o;
  }

  describe('maxDepth option', function () {
    it('should throw AxiosError when payload exceeds default depth limit (100)', function () {
      try {
        toFormData(nest(101), new FormData());
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err instanceof AxiosError).toBe(true);
        expect(err.code).toEqual('ERR_FORM_DATA_DEPTH_EXCEEDED');
        expect(err instanceof RangeError).toBe(false);
      }
    });

    it('should succeed when payload is exactly at the default depth limit (100)', function () {
      var formData = toFormData(nest(100), new FormData());
      expect(formData instanceof FormData).toBe(true);
    });

    it('should succeed for a shallow payload (no regression)', function () {
      var formData = toFormData(nest(5), new FormData());
      expect(formData instanceof FormData).toBe(true);
    });

    it('should allow deeper payloads when maxDepth is raised', function () {
      var formData = toFormData(nest(150), new FormData(), { maxDepth: 200 });
      expect(formData instanceof FormData).toBe(true);
    });

    it('should reject shallower payloads when maxDepth is lowered', function () {
      try {
        toFormData(nest(10), new FormData(), { maxDepth: 5 });
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err instanceof AxiosError).toBe(true);
        expect(err.code).toEqual('ERR_FORM_DATA_DEPTH_EXCEEDED');
      }
    });

    it('should not throw for depth guard when maxDepth is Infinity', function () {
      var formData = toFormData(nest(500), new FormData(), { maxDepth: Infinity });
      expect(formData instanceof FormData).toBe(true);
    });

    it('should still detect circular references when depth guard is active', function () {
      var data = { foo: 'bar' };
      data.self = data;
      try {
        toFormData(data, new FormData());
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('Circular reference detected');
      }
    });

    it('depth limit error is catchable as AxiosError with correct code', function () {
      var caught;
      try {
        toFormData(nest(101), new FormData());
      } catch (err) {
        caught = err;
      }
      expect(caught instanceof AxiosError).toBe(true);
      expect(caught.code).toEqual('ERR_FORM_DATA_DEPTH_EXCEEDED');
      expect(caught instanceof RangeError).toBe(false);
    });
  });

  describe('maxDepth — params serialization via AxiosURLSearchParams', function () {
    it('should throw AxiosError for deeply nested params object (default limit)', function () {
      try {
        // eslint-disable-next-line no-new
        new AxiosURLSearchParams(nest(101));
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err instanceof AxiosError).toBe(true);
        expect(err.code).toEqual('ERR_FORM_DATA_DEPTH_EXCEEDED');
      }
    });

    it('should build query string for deep params when maxDepth is raised', function () {
      var params = new AxiosURLSearchParams(nest(150), { maxDepth: 200 });
      var qs = params.toString();
      expect(typeof qs).toEqual('string');
      expect(qs.length > 0).toBe(true);
    });
  });
});

