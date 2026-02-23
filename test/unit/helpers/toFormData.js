import assert from 'assert';
import toFormData from '../../../lib/helpers/toFormData.js';
import FormData from 'form-data';

describe('helpers::toFormData', function () {
  function createRNFormDataSpy() {
    const calls = [];
    return {
      calls,
      append(key, value) {
        calls.push([key, value]);
      },
      getParts() {
        return [];
      }
    };
  }
  
  it('should convert a flat object to FormData', function () {
    const data = {
      foo: 'bar',
      baz: 123,
    };

    const formData = toFormData(data, new FormData());

    assert.ok(formData instanceof FormData);
    // form-data package specific checks
    assert.ok(formData._streams.length > 0);
  });

  it('should convert a nested object to FormData', function () {
    const data = {
      foo: {
        bar: 'baz',
      },
    };

    const formData = toFormData(data, new FormData());

    assert.ok(formData instanceof FormData);
  });

  it('should throw Error on circular reference', function () {
    const data = {
      foo: 'bar',
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
      arr: [1, 2, 3],
    };

    const formData = toFormData(data, new FormData());
    assert.ok(formData instanceof FormData);
  });

  it('should append root-level React Native blob without recursion', function () {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://test.png',
      type: 'image/png',
      name: 'test.png'
    };

    toFormData({ file: blob }, formData);

    assert.strictEqual(formData.calls.length, 1);
    assert.strictEqual(formData.calls[0][0], 'file');
    assert.strictEqual(formData.calls[0][1], blob);
  });

  it('should append nested React Native blob without recursion', function () {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://nested.png',
      type: 'image/png',
      name: 'nested.png'
    };

    toFormData({ nested: { file: blob } }, formData);

    assert.strictEqual(formData.calls.length, 1);
    assert.strictEqual(formData.calls[0][0], 'nested[file]');
    assert.strictEqual(formData.calls[0][1], blob);
  });

  it('should append deeply nested React Native blob without recursion', function () {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://deep.png',
      name: 'deep.png'
    };

    toFormData({ a: { b: { c: blob } } }, formData);

    assert.strictEqual(formData.calls.length, 1);
    assert.strictEqual(formData.calls[0][0], 'a[b][c]');
    assert.strictEqual(formData.calls[0][1], blob);
  });

  it('should NOT recurse into React Native blob properties', function () {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://nope.png',
      type: 'image/png',
      name: 'nope.png'
    };

    toFormData({ file: blob }, formData);

    const keys = formData.calls.map(call => call[0]);

    assert.deepStrictEqual(keys, ['file']);
    assert.ok(!keys.some(k => k.includes('uri')));
    assert.ok(!keys.some(k => k.includes('type')));
    assert.ok(!keys.some(k => k.includes('name')));
  });
});
