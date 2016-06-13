var enhanceError = require('../../../lib/core/enhanceError');

describe('core::enhanceError', function() {
  it('should add config and code to error', function() {
    var error = new Error('Boom!');
    enhanceError(error, { foo: 'bar' }, 'ESOMETHING');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
  });

  it('should return error', function() {
    var error = new Error('Boom!');
    expect(enhanceError(error, { foo: 'bar' }, 'ESOMETHING')).toBe(error);
  });
});
