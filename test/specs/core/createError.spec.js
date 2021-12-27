var createError = require('../../../lib/core/createError');

describe('core::createError', function() {
  it('should create an Error with message, config, code, request, response and isAxiosError', function() {
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };
    var error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING', request, response);
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.isAxiosError).toBe(true);
  });
  it('should create an Error that can be serialized to JSON', function() {
    // Attempting to serialize request and response results in
    //    TypeError: Converting circular structure to JSON
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };
    var error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING', request, response);
    var json = error.toJSON();
    expect(json.message).toBe('Boom!');
    expect(json.config).toEqual({ foo: 'bar' });
    expect(json.code).toBe('ESOMETHING');
    expect(json.status).toBe(200);
    expect(json.request).toBe(undefined);
    expect(json.response).toBe(undefined);
  });
});
