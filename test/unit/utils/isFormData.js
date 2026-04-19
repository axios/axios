var assert = require('assert');
var isFormData = require('../../../lib/utils').isFormData;
var FormData = require('form-data');

describe('utils::isFormData', function () {
  it('should detect the FormData instance provided by the `form-data` package', function () {
    [1, 'str', {}, new RegExp()].forEach(function (thing) {
      assert.equal(isFormData(thing), false);
    });
    assert.equal(isFormData(new FormData()), true);
  });

  describe('prototype-pollution spoofing (GHSA-6chq-wfr3-2hj9)', function () {
    var originalToString = Object.getOwnPropertyDescriptor(Object.prototype, 'toString');

    afterEach(function () {
      delete Object.prototype.append;
      if (originalToString) {
        Object.defineProperty(Object.prototype, 'toString', originalToString);
      } else {
        delete Object.prototype.toString;
      }
    });

    it('should reject a plain object spoofing toString === "[object FormData]"', function () {
      var spoof = {
        append: function () {},
        toString: function () { return '[object FormData]'; }
      };
      assert.strictEqual(isFormData(spoof), false);
    });

    it('should reject a plain object with an append function', function () {
      assert.strictEqual(isFormData({ append: function () {} }), false);
    });

    it('should reject a plain object with toString and append pulled from a polluted Object.prototype', function () {
      Object.prototype.append = function () {};
      Object.prototype.toString = function () { return '[object FormData]'; };
      assert.strictEqual(isFormData({}), false);
    });

    it('should reject an object with a null prototype even when it has an append function', function () {
      var nullProto = Object.create(null);
      nullProto.append = function () {};
      assert.strictEqual(isFormData(nullProto), false);
    });
  });

  describe('non-object inputs', function () {
    it('should reject primitives without throwing (ES5 Object.getPrototypeOf guard)', function () {
      [undefined, null, false, true, 0, 1, '', 'body', NaN].forEach(function (thing) {
        assert.doesNotThrow(function () { isFormData(thing); });
        assert.strictEqual(isFormData(thing), false);
      });
    });

    it('should reject functions', function () {
      assert.strictEqual(isFormData(function () {}), false);
    });
  });
});
