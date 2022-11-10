import assert from 'assert';
import toURLEncodedForm from "../../../lib/helpers/toURLEncodedForm.js";
import qs from 'qs';

describe('helpers::toURLEncodedForm', function () {
  it('should have parity with qs v6.11.0 (brackets & indices)', function () {
    const params = {
      arr1: [1, [2, {x: 1}], 3],
      x: {arr2: [1, 2]}
    };

    Object.entries({
      'brackets': false,
      'indices': true
    }).forEach(([qsMode, axiosMode]) => {
      assert.deepStrictEqual(
        decodeURI(toURLEncodedForm(params, {indexes: axiosMode})),
        decodeURI(qs.stringify(params, {arrayFormat: qsMode})),
        `Failed in index mode ${axiosMode} (${qsMode})`
      );
    });
  });
});
