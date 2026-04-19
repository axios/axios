'use strict';

var assert = require('assert');
var FormData = require('form-data');
var toFormData = require('../../../lib/helpers/toFormData');

describe('helpers::toFormData', function () {
  describe('depth limit (GHSA-62hf-57xw-28j9)', function () {
    it('should throw a bounded error for deeply nested payloads instead of overflowing the stack', function () {
      var payload = { leaf: 1 };
      for (var i = 0; i < 2500; i++) {
        payload = { a: payload };
      }

      assert.throws(function () {
        toFormData(payload, new FormData());
      }, function (err) {
        return err && /Maximum object depth/.test(err.message);
      });
    });

    it('should accept payloads well under the depth cap', function () {
      var payload = { leaf: 1 };
      for (var i = 0; i < 50; i++) {
        payload = { a: payload };
      }

      assert.doesNotThrow(function () {
        toFormData(payload, new FormData());
      });
    });
  });
});
