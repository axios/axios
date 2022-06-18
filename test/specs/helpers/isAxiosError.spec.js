import AxiosError from '../../../lib/core/AxiosError';
import isAxiosError from '../../../lib/helpers/isAxiosError';

describe('helpers::isAxiosError', function() {
  it('should return true if the error is created by core::createError', function() {
    expect(isAxiosError(new AxiosError('Boom!', null, { foo: 'bar' })))
      .toBe(true);
  });

  it('should return true if the error is enhanced by core::enhanceError', function() {
    expect(isAxiosError(AxiosError.from(new Error('Boom!'), null, { foo: 'bar' })))
      .toBe(true);
  });

  it('should return false if the error is a normal Error instance', function() {
    expect(isAxiosError(new Error('Boom!')))
      .toBe(false);
  });

  it('should return false if the error is null', function () {
    expect(isAxiosError(null))
      .toBe(false);
  });
});
