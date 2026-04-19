'use strict';

var assert = require('assert');
var AxiosURLSearchParams = require('../../../lib/helpers/AxiosURLSearchParams');

describe('helpers::AxiosURLSearchParams', function () {
  describe('null byte encoding (GHSA-xhjh-pmcv-23jw)', function () {
    it('should not reverse the safe percent-encoding of null bytes', function () {
      var params = new AxiosURLSearchParams({ name: 'foo\x00.jpg' });
      var serialized = params.toString();

      assert.strictEqual(serialized.indexOf('\x00'), -1, 'serialized string must not contain a raw null byte');
      assert.ok(/%00/.test(serialized), 'null byte must remain percent-encoded as %00');
    });
  });
});
