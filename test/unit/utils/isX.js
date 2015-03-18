var utils = require('../../../lib/utils');

module.exports = {
  testIsArray: function (test) {
    test.equals(utils.isArray([]), true);
    test.equals(utils.isArray({length: 5}), false);
    test.done();
  },

  testIsArrayBuffer: function (test) {
    test.equals(utils.isArrayBuffer(new ArrayBuffer(2)), true);
    test.done();
  },

  testIsArrayBufferView: function (test) {
    test.equals(utils.isArrayBufferView(new DataView(new ArrayBuffer(2))), true);
    test.done();
  },

  // TODO These tests need a browser to run
  // testIsFormData: function (test) {
  //   test.equals(utils.isFormData(new FormData()), true);
  //   test.done();
  // },
  //
  // testIsBlob: function (test) {
  //   test.equals(utils.isBlob(new Blob(['<h1>Foo</h1>'], {type: 'text/html'})), true);
  //   test.done();
  // },

  testIsString: function (test) {
    test.equals(utils.isString(''), true);
    test.equals(utils.isString({toString: function () { return ''; }}), false);
    test.done();
  },

  testIsNumber: function (test) {
    test.equals(utils.isNumber(123), true);
    test.equals(utils.isNumber('123'), false);
    test.done();
  },

  testIsUndefined: function (test) {
    test.equals(utils.isUndefined(), true);
    test.equals(utils.isUndefined(null), false);
    test.done();
  },

  testIsObject: function (test) {
    test.equals(utils.isObject({}), true);
    test.equals(utils.isObject(null), false);
    test.done();
  },

  testIsDate: function (test) {
    test.equals(utils.isDate(new Date()), true);
    test.equals(utils.isDate(Date.now()), false);
    test.done();
  }
};
