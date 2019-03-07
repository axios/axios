var utils = require('../../../lib/utils');
var Stream = require('stream');

describe('utils::isX', () => {
  it('should validate Array', () => {
    expect(utils.isArray([])).toEqual(true);
    expect(utils.isArray({length: 5})).toEqual(false);
  });

  it('should validate ArrayBuffer', () => {
    expect(utils.isArrayBuffer(new ArrayBuffer(2))).toEqual(true);
    expect(utils.isArrayBuffer({})).toEqual(false);
  });

  it('should validate ArrayBufferView', () => {
    expect(utils.isArrayBufferView(new DataView(new ArrayBuffer(2)))).toEqual(true);
  });

  it('should validate FormData', () => {
    expect(utils.isFormData(new FormData())).toEqual(true);
  });

  it('should validate Blob', () => {
    expect(utils.isBlob(new Blob())).toEqual(true);
  });

  it('should validate String', () => {
    expect(utils.isString('')).toEqual(true);
    expect(utils.isString({toString: () => ''})).toEqual(false);
  });

  it('should validate Number', () => {
    expect(utils.isNumber(123)).toEqual(true);
    expect(utils.isNumber('123')).toEqual(false);
  });

  it('should validate Undefined', () => {
    expect(utils.isUndefined()).toEqual(true);
    expect(utils.isUndefined(null)).toEqual(false);
  });

  it('should validate Object', () => {
    expect(utils.isObject({})).toEqual(true);
    expect(utils.isObject(null)).toEqual(false);
  });

  it('should validate Date', () => {
    expect(utils.isDate(new Date())).toEqual(true);
    expect(utils.isDate(Date.now())).toEqual(false);
  });

  it('should validate Function', () => {
    expect(utils.isFunction(() => {})).toEqual(true);
    expect(utils.isFunction('function')).toEqual(false);
  });

  it('should validate Stream', () => {
    expect(utils.isStream(new Stream.Readable())).toEqual(true);
    expect(utils.isStream({ foo: 'bar' })).toEqual(false);
  });

  it('should validate URLSearchParams', () => {
    expect(utils.isURLSearchParams(new URLSearchParams())).toEqual(true);
    expect(utils.isURLSearchParams('foo=1&bar=2')).toEqual(false);
  });
});
