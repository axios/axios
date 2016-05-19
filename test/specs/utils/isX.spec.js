var utils = require('../../../lib/utils');
var Stream = require('stream');

describe('utils::isX', function () {
  it('should validate Array', function () {
    expect(utils.isArray([])).toEqual(true);
    expect(utils.isArray({length: 5})).toEqual(false);
  });

  it('should validate ArrayBuffer', function () {
    // ArrayBuffer doesn't exist in IE8/9
    if (isOldIE && typeof ArrayBuffer === 'undefined') {
      return;
    }

    expect(utils.isArrayBuffer(new ArrayBuffer(2))).toEqual(true);
    expect(utils.isArrayBuffer({})).toEqual(false);
  });

  it('should validate ArrayBufferView', function () {
    // ArrayBuffer doesn't exist in IE8/9
    if (isOldIE && typeof ArrayBuffer === 'undefined') {
      return;
    }

    expect(utils.isArrayBufferView(new DataView(new ArrayBuffer(2)))).toEqual(true);
  });

  it('should validate FormData', function () {
    // FormData doesn't exist in IE8/9
    if (isOldIE && typeof FormData === 'undefined') {
      return;
    }

    expect(utils.isFormData(new FormData())).toEqual(true);
  });

  it('should validate Blob', function () {
    // Blob doesn't exist in IE8/9
    if (isOldIE && typeof Blob === 'undefined') {
      return;
    }

    expect(utils.isBlob(new Blob())).toEqual(true);
  });

  it('should validate String', function () {
    expect(utils.isString('')).toEqual(true);
    expect(utils.isString({toString: function () { return ''; }})).toEqual(false);
  });

  it('should validate Number', function () {
    expect(utils.isNumber(123)).toEqual(true);
    expect(utils.isNumber('123')).toEqual(false);
  });

  it('should validate Undefined', function () {
    expect(utils.isUndefined()).toEqual(true);
    expect(utils.isUndefined(null)).toEqual(false);
  });

  it('should validate Object', function () {
    expect(utils.isObject({})).toEqual(true);
    expect(utils.isObject(null)).toEqual(false);
  });

  it('should validate Date', function () {
    expect(utils.isDate(new Date())).toEqual(true);
    expect(utils.isDate(Date.now())).toEqual(false);
  });

  it('should validate Function', function () {
    expect(utils.isFunction(function () {})).toEqual(true);
    expect(utils.isFunction('function')).toEqual(false);
  });

  it('should validate Stream', function () {
    expect(utils.isStream(new Stream.Readable())).toEqual(true);
    expect(utils.isStream({ foo: 'bar' })).toEqual(false);
  });

  it('should validate URLSearchParams', function () {
    expect(utils.isURLSearchParams(new URLSearchParams())).toEqual(true);
    expect(utils.isURLSearchParams('foo=1&bar=2')).toEqual(false);
  });
});
