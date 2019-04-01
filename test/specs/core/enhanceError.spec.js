var enhanceError = require('../../../lib/core/enhanceError');

describe('core::enhanceError', function() {
  it('should add config, config, request and response to error', function() {
    var error = new Error('Boom!');
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };

    enhanceError(error, { foo: 'bar' }, 'ESOMETHING', request, response);
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.isAxiosError).toBe(true);
  });

  it('should return error', function() {
    var error = new Error('Boom!');
    expect(enhanceError(error, { foo: 'bar' }, 'ESOMETHING')).toBe(error);
  });
});
