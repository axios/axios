var enhanceError = require('../../../lib/core/enhanceError');

describe('core::enhanceError', function() {
  it('should add config, code, request, response, and toJSON function to error', function() {
    var error = new Error('Boom!');
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };

    enhanceError(error, { foo: 'bar' }, 'ESOMETHING', request, response);
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(typeof error.toJSON).toBe('function');
    expect(error.isAxiosError).toBe(true);
  });

  it('should serialize to JSON with a status of null when there is no response', function() {
    var error = new Error('Boom!');
    var request = { path: '/foo' };
    var response = undefined;

    var errorAsJson = enhanceError(error, { foo: 'bar' }, 'ESOMETHING', request, response).toJSON();
    expect(errorAsJson.status).toEqual(null);
  });

  it('should return error', function() {
    var error = new Error('Boom!');
    expect(enhanceError(error, { foo: 'bar' }, 'ESOMETHING')).toBe(error);
  });
});
