var createError = require('../../../lib/core/createError');

describe('core::createError', function() {
  it('should create an Error with message, config, and code', function() {
    var error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING');
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
  });
});
