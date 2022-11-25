import assert from 'assert';
import utils from '../../../lib/utils.js';
import FormData from 'form-data';
import stream from 'stream';

describe('utils', function (){
  it('should validate Stream', function () {
    assert.strictEqual(utils.isStream(new stream.Readable()),true);
    assert.strictEqual(utils.isStream({ foo: 'bar' }),false);
  });

  it('should validate Buffer', function () {
    assert.strictEqual(utils.isBuffer(Buffer.from('a')),true);
    assert.strictEqual(utils.isBuffer(null),false);
    assert.strictEqual(utils.isBuffer(undefined),false);
  });

  describe('utils::isFormData', function () {
    it('should detect the FormData instance provided by the `form-data` package', function () {
      [1, 'str', {}, new RegExp()].forEach(function (thing) {
        assert.equal(utils.isFormData(thing), false);
      });
      assert.equal(utils.isFormData(new FormData()), true);
    });
  });

  describe('toJSON', function (){
    it('should convert to a plain object without circular references', function () {
      const obj= {a: [0]}
      const source = {x:1, y:2, obj};
      source.circular1 = source;
      obj.a[1] = obj;

      assert.deepStrictEqual(utils.toJSONObject(source), {
        x: 1, y:2, obj: {a: [0]}
      });
    });

    it('should use objects with defined toJSON method without rebuilding', function () {
      const objProp = {};
      const obj= {objProp, toJSON(){
        return {ok: 1}
      }};
      const source = {x:1, y:2, obj};

      const jsonObject = utils.toJSONObject(source);

      assert.strictEqual(jsonObject.obj.objProp, objProp);
      assert.strictEqual(JSON.stringify(jsonObject), JSON.stringify({x: 1, y:2, obj: {ok: 1}}))
    });
  });
});
