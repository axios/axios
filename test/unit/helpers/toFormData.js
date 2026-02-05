import assert from 'assert';
import toFormData from '../../../lib/helpers/toFormData.js';
import FormData from 'form-data';

describe('helpers::toFormData', function () {
  it('should convert a flat object to FormData', function () {
    const data = {
      foo: 'bar',
      baz: 123
    };

    const formData = toFormData(data, new FormData());
    
    assert.ok(formData instanceof FormData);
    // form-data package specific checks
    assert.ok(formData._streams.length > 0);
  });

  it('should convert a nested object to FormData', function () {
    const data = {
      foo: {
        bar: 'baz'
      }
    };

    const formData = toFormData(data, new FormData());
    
    assert.ok(formData instanceof FormData);
  });

  it('should throw Error on circular reference', function () {
    const data = {
      foo: 'bar'
    };
    data.self = data;

    try {
      toFormData(data, new FormData());
      assert.fail('Should have thrown an error');
    } catch (e) {
      assert.strictEqual(e.message, 'Circular reference detected in self');
    }
  });

  it('should handle arrays', function () {
    const data = {
      arr: [1, 2, 3]
    };

    const formData = toFormData(data, new FormData());
    assert.ok(formData instanceof FormData);
  });
});
