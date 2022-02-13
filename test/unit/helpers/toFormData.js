'use strict';
var toFormData = require('../../../lib/helpers/toFormData');
var NodeFormData = require('form-data');

var assert = require('assert');

describe('toFormData', function() {
  it('Should convert nested object to FormData(`form-data` package) properly', function() {
    var o = {
      val: 123,
      nested: {
        arr: ['hello', 'world']
      }
    };

    var nodeFormData = toFormData(o, new NodeFormData());
    var stringRepresentation = nodeFormData.getBuffer().toString();

    assert(stringRepresentation.indexOf(
      'name="val"\r\n' + '\r\n' + '123'
    ) !== -1, true);

    assert.equal(stringRepresentation.indexOf(
      'name="nested.arr.0"\r\n' + '\r\n' + 'hello'
    ) !== -1, true);
  });
});


/*

Expecting stringRepresentation to be of this form:

----------------------------730920072453104889232116
Content-Disposition: form-data; name="val"

123
----------------------------730920072453104889232116
Content-Disposition: form-data; name="nested.arr.0"

hello
----------------------------730920072453104889232116
Content-Disposition: form-data; name="nested.arr.1"

world
----------------------------730920072453104889232116--

*/
