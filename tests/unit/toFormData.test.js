import { describe, it } from 'vitest';
import assert from 'assert';
import FormData from 'form-data';
import toFormData from '../../lib/helpers/toFormData.js';
import AxiosError from '../../lib/core/AxiosError.js';
import AxiosURLSearchParams from '../../lib/helpers/AxiosURLSearchParams.js';

describe('helpers::toFormData', () => {
  const createRNFormDataSpy = () => {
    const calls = [];
    return {
      calls,
      append: (key, value) => {
        calls.push([key, value]);
      },
      getParts: () => {
        return [];
      },
    };
  };

  it('should convert a flat object to FormData', () => {
    const data = {
      foo: 'bar',
      baz: 123,
    };

    const formData = toFormData(data, new FormData());

    assert.ok(formData instanceof FormData);
    assert.ok(formData._streams.length > 0);
  });

  it('should convert a nested object to FormData', () => {
    const data = {
      foo: {
        bar: 'baz',
      },
    };

    const formData = toFormData(data, new FormData());

    assert.ok(formData instanceof FormData);
  });

  it('should throw Error on circular reference', () => {
    const data = {
      foo: 'bar',
    };
    data.self = data;

    try {
      toFormData(data, new FormData());
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual(err.message, 'Circular reference detected in self');
    }
  });

  it('should handle arrays', () => {
    const data = {
      arr: [1, 2, 3],
    };

    const formData = toFormData(data, new FormData());
    assert.ok(formData instanceof FormData);
  });

  it('should append root-level React Native blob without recursion', () => {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://test.png',
      type: 'image/png',
      name: 'test.png',
    };

    toFormData({ file: blob }, formData);

    assert.strictEqual(formData.calls.length, 1);
    assert.strictEqual(formData.calls[0][0], 'file');
    assert.strictEqual(formData.calls[0][1], blob);
  });

  it('should append nested React Native blob without recursion', () => {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://nested.png',
      type: 'image/png',
      name: 'nested.png',
    };

    toFormData({ nested: { file: blob } }, formData);

    assert.strictEqual(formData.calls.length, 1);
    assert.strictEqual(formData.calls[0][0], 'nested[file]');
    assert.strictEqual(formData.calls[0][1], blob);
  });

  it('should append deeply nested React Native blob without recursion', () => {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://deep.png',
      name: 'deep.png',
    };

    toFormData({ a: { b: { c: blob } } }, formData);

    assert.strictEqual(formData.calls.length, 1);
    assert.strictEqual(formData.calls[0][0], 'a[b][c]');
    assert.strictEqual(formData.calls[0][1], blob);
  });

  // --- Depth limit tests ---

  function nest(depth) {
    let o = { leaf: 1 };
    for (let i = 0; i < depth; i++) o = { a: o };
    return o;
  }

  describe('maxDepth option', () => {
    it('should throw AxiosError when payload exceeds default depth limit (100)', () => {
      try {
        toFormData(nest(101), new FormData());
        assert.fail('Should have thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError, 'error must be AxiosError, not RangeError');
        assert.strictEqual(err.code, 'ERR_FORM_DATA_DEPTH_EXCEEDED');
        assert.ok(!(err instanceof RangeError));
      }
    });

    it('should succeed when payload is exactly at the default depth limit (100)', () => {
      const formData = toFormData(nest(100), new FormData());
      assert.ok(formData instanceof FormData);
    });

    it('should succeed for a shallow payload (no regression)', () => {
      const formData = toFormData(nest(5), new FormData());
      assert.ok(formData instanceof FormData);
    });

    it('should allow deeper payloads when maxDepth is raised', () => {
      const formData = toFormData(nest(150), new FormData(), { maxDepth: 200 });
      assert.ok(formData instanceof FormData);
    });

    it('should reject shallower payloads when maxDepth is lowered', () => {
      try {
        toFormData(nest(10), new FormData(), { maxDepth: 5 });
        assert.fail('Should have thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, 'ERR_FORM_DATA_DEPTH_EXCEEDED');
      }
    });

    it('should not throw for depth guard when maxDepth is Infinity (guard disabled)', () => {
      // Use 500 levels — deep enough to prove the guard is off, shallow enough not to overflow V8
      const formData = toFormData(nest(500), new FormData(), { maxDepth: Infinity });
      assert.ok(formData instanceof FormData);
    });

    it('should still detect circular references when depth guard is active', () => {
      const data = { foo: 'bar' };
      data.self = data;
      try {
        toFormData(data, new FormData());
        assert.fail('Should have thrown');
      } catch (err) {
        assert.ok(
          err.message.includes('Circular reference detected'),
          'must be circular-ref error'
        );
        assert.ok(!(err instanceof AxiosError) || err.code !== 'ERR_FORM_DATA_DEPTH_EXCEEDED');
      }
    });

    it('depth limit error is catchable as AxiosError with correct code', () => {
      let caught;
      try {
        toFormData(nest(101), new FormData());
      } catch (err) {
        caught = err;
      }
      assert.ok(caught instanceof AxiosError);
      assert.strictEqual(caught.code, 'ERR_FORM_DATA_DEPTH_EXCEEDED');
      assert.ok(!(caught instanceof RangeError));
    });
  });

  describe('maxDepth — params serialization via AxiosURLSearchParams', () => {
    it('should throw AxiosError for deeply nested params object (default limit)', () => {
      try {
        new AxiosURLSearchParams(nest(101));
        assert.fail('Should have thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, 'ERR_FORM_DATA_DEPTH_EXCEEDED');
      }
    });

    it('should build query string for deep params when maxDepth is raised', () => {
      const params = new AxiosURLSearchParams(nest(150), { maxDepth: 200 });
      const qs = params.toString();
      assert.ok(typeof qs === 'string' && qs.length > 0);
    });
  });

  it('should NOT recurse into React Native blob properties', () => {
    const formData = createRNFormDataSpy();

    const blob = {
      uri: 'file://nope.png',
      type: 'image/png',
      name: 'nope.png',
    };

    toFormData({ file: blob }, formData);

    const keys = formData.calls.map((call) => call[0]);

    assert.deepStrictEqual(keys, ['file']);
    assert.ok(!keys.some((key) => key.includes('uri')));
    assert.ok(!keys.some((key) => key.includes('type')));
    assert.ok(!keys.some((key) => key.includes('name')));
  });
});
