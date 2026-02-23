import assert from 'assert';
import utils from '../../../lib/utils.js';
import FormData from 'form-data';
import stream from 'stream';

describe('utils', function () {
  it('should validate Stream', function () {
    assert.strictEqual(utils.isStream(new stream.Readable()), true);
    assert.strictEqual(utils.isStream({ foo: 'bar' }), false);
  });

  it('should validate Buffer', function () {
    assert.strictEqual(utils.isBuffer(Buffer.from('a')), true);
    assert.strictEqual(utils.isBuffer(null), false);
    assert.strictEqual(utils.isBuffer(undefined), false);
  });

  describe('utils::isFormData', function () {
    it('should detect the FormData instance provided by the `form-data` package', function () {
      [1, 'str', {}, new RegExp()].forEach(function (thing) {
        assert.equal(utils.isFormData(thing), false);
      });
      assert.equal(utils.isFormData(new FormData()), true);
    });

    it('should not call toString method on built-in objects instances', () => {
      const buf = Buffer.from('123');

      buf.toString = () => assert.fail('should not be called');

      assert.equal(utils.isFormData(buf), false);
    });

    it('should not call toString method on built-in objects instances, even if append method exists', () => {
      const buf = Buffer.from('123');

      buf.append = () => {};

      buf.toString = () => assert.fail('should not be called');

      assert.equal(utils.isFormData(buf), false);
    });

    it('should detect custom FormData instances by toStringTag signature and append method presence', () => {
      class FormData {
        append() {}

        get [Symbol.toStringTag]() {
          return 'FormData';
        }
      }
      assert.equal(utils.isFormData(new FormData()), true);
    });
  });

  describe('toJSON', function () {
    it('should convert to a plain object without circular references', function () {
      const obj = { a: [0] };
      const source = { x: 1, y: 2, obj };
      source.circular1 = source;
      obj.a[1] = obj;

      assert.deepStrictEqual(utils.toJSONObject(source), {
        x: 1,
        y: 2,
        obj: { a: [0] },
      });
    });

    it('should use objects with defined toJSON method without rebuilding', function () {
      const objProp = {};
      const obj = {
        objProp,
        toJSON() {
          return { ok: 1 };
        },
      };
      const source = { x: 1, y: 2, obj };

      const jsonObject = utils.toJSONObject(source);

      assert.strictEqual(jsonObject.obj.objProp, objProp);
      assert.strictEqual(
        JSON.stringify(jsonObject),
        JSON.stringify({ x: 1, y: 2, obj: { ok: 1 } })
      );
    });
  });

  describe('Buffer RangeError Fix', function () {
    it('should handle large Buffer in isEmptyObject without RangeError', function () {
      // Create a big buffer that used to cause the error
      const largeBuffer = Buffer.alloc(1024 * 1024 * 200); // 200MB

      // This used to throw: RangeError: Invalid array length
      // Now it should work fine
      const result = utils.isEmptyObject(largeBuffer);

      // Buffer should not be considered an empty object
      assert.strictEqual(result, false);
    });

    it('should handle large Buffer in forEach without RangeError', function () {
      const largeBuffer = Buffer.alloc(1024 * 1024 * 200); // 200MB
      let count = 0;

      // This should skip the buffer (not iterate through it)
      utils.forEach(largeBuffer, () => count++);

      // Count should be 0 because forEach skips Buffers
      assert.strictEqual(count, 0);
    });

    it('should handle large Buffer in findKey without RangeError', function () {
      const largeBuffer = Buffer.alloc(1024 * 1024 * 200); // 200MB

      // Should return null for Buffers
      const result = utils.findKey(largeBuffer, 'test');

      assert.strictEqual(result, null);
    });
  });

  describe('utils::isReactNativeBlob', function () {
    it('should return true for objects with uri property', function () {
      assert.strictEqual(utils.isReactNativeBlob({ uri: 'file://path/to/file' }), true);
      assert.strictEqual(utils.isReactNativeBlob({ uri: 'content://media/image' }), true);
    });

    it('should return true for React Native blob-like objects with optional name and type', function () {
      assert.strictEqual(utils.isReactNativeBlob({ 
        uri: 'file://path/to/file',
        name: 'image.png',
        type: 'image/png'
      }), true);
    });

    it('should return false for objects without uri property', function () {
      assert.strictEqual(utils.isReactNativeBlob({ path: 'file://path' }), false);
      assert.strictEqual(utils.isReactNativeBlob({ url: 'http://example.com' }), false);
      assert.strictEqual(utils.isReactNativeBlob({}), false);
    });

    it('should return false for non-objects', function () {
      assert.strictEqual(utils.isReactNativeBlob(null), false);
      assert.strictEqual(utils.isReactNativeBlob(undefined), false);
      assert.strictEqual(utils.isReactNativeBlob('string'), false);
      assert.strictEqual(utils.isReactNativeBlob(123), false);
      assert.strictEqual(utils.isReactNativeBlob(false), false);
    });

    it('should return true even if uri is empty string', function () {
      assert.strictEqual(utils.isReactNativeBlob({ uri: '' }), true);
    });
  });

  describe('utils::isReactNative', function () {
    it('should return true for FormData with getParts method', function () {
      const mockReactNativeFormData = {
        append: function() {},
        getParts: function() { return []; }
      };
      assert.strictEqual(utils.isReactNative(mockReactNativeFormData), true);
    });

    it('should return false for standard FormData without getParts method', function () {
      const standardFormData = new FormData();
      assert.strictEqual(utils.isReactNative(standardFormData), false);
    });

    it('should return false for objects without getParts method', function () {
      assert.strictEqual(utils.isReactNative({ append: function() {} }), false);
      assert.strictEqual(utils.isReactNative({}), false);
    });
  });
});
