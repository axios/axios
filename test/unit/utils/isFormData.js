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
});
