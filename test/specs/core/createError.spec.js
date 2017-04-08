var createError = require('../../../lib/core/createError');

describe('core::createError', function() {
  it('should create an Error with message, config, code, request and response', function() {
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };
    var error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING', request, response);
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
  });
});
