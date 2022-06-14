import assert from 'assert';
import utils from '../../../lib/utils.js';
import FormData from 'form-data';

describe('utils::isFormData', function () {
  it('should detect the FormData instance provided by the `form-data` package', function () {
    [1, 'str', {}, new RegExp()].forEach(function (thing) {
      assert.equal(utils.isFormData(thing), false);
    });
    assert.equal(utils.isFormData(new FormData()), true);
  });
});
