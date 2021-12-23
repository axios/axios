var createError = require('../../../lib/core/createError');
var enhanceError = require('../../../lib/core/enhanceError');
var isAxiosError = require('../../../lib/helpers/isAxiosError');

describe('helpers::isAxiosError', function () {
  it('should return true if the error is created by core::createError', function () {
    expect(isAxiosError(createError('Boom!', { foo: 'bar' })))
      .toBe(true);
  });

  it('should return true if the error is enhanced by core::enhanceError', function () {
    expect(isAxiosError(enhanceError(new Error('Boom!'), { foo: 'bar' })))
      .toBe(true);
  });

  it('should return false if the error is a normal Error instance', function () {
    expect(isAxiosError(new Error('Boom!')))
      .toBe(false);
  });

  it('should return false if the error is null', function () {
    expect(isAxiosError(null))
      .toBe(false);
  });
});
