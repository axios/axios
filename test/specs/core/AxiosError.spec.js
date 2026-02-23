import AxiosError from '../../../lib/core/AxiosError';

describe('core::AxiosError', function () {
  it('should create an Error with message, config, code, request, response, stack and isAxiosError', function () {
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.isAxiosError).toBe(true);
    expect(error.stack).toBeDefined();
  });
  it('should create an Error that can be serialized to JSON', function () {
    // Attempting to serialize request and response results in
    //    TypeError: Converting circular structure to JSON
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);
    const json = error.toJSON();
    expect(json.message).toBe('Boom!');
    expect(json.config).toEqual({ foo: 'bar' });
    expect(json.code).toBe('ESOMETHING');
    expect(json.status).toBe(200);
    expect(json.request).toBe(undefined);
    expect(json.response).toBe(undefined);
  });

  describe('core::createError.from', function () {
    it('should add config, config, request and response to error', function () {
      const error = new Error('Boom!');
      const request = { path: '/foo' };
      const response = { status: 200, data: { foo: 'bar' } };

      const axiosError = AxiosError.from(error, 'ESOMETHING', { foo: 'bar' }, request, response);
      expect(axiosError.config).toEqual({ foo: 'bar' });
      expect(axiosError.code).toBe('ESOMETHING');
      expect(axiosError.request).toBe(request);
      expect(axiosError.response).toBe(response);
      expect(axiosError.isAxiosError).toBe(true);
    });

    it('should return error', function () {
      const error = new Error('Boom!');
      expect(
        AxiosError.from(error, 'ESOMETHING', { foo: 'bar' }) instanceof AxiosError
      ).toBeTruthy();
    });

    it('should preserve status property from original error when response is not provided', function () {
      const error = new Error('Network Error');
      error.status = 404;

      const axiosError = AxiosError.from(error, 'ERR_NETWORK', { foo: 'bar' });
      expect(axiosError.status).toBe(404);
    });

    it('should use response.status over error.status when response is provided', function () {
      const error = new Error('Error');
      error.status = 500;
      const response = { status: 404 };

      const axiosError = AxiosError.from(error, 'ERR_BAD_REQUEST', {}, null, response);
      expect(axiosError.status).toBe(404);
    });
  });

  it('should be a native error as checked by the NodeJS `isNativeError` function', function () {
    if (typeof process !== 'undefined' && process.release.name === 'node') {
      let { isNativeError } = require('node:util/types');
      expect(isNativeError(new AxiosError('My Axios Error'))).toBeTruthy();
    }
  });

  it('should create an error using one of the static class properties as an error code', function () {
    const myError = new AxiosError('My Axios Error', AxiosError.ECONNABORTED);
    expect(myError.code).toEqual(AxiosError.ECONNABORTED);
  });

  it('should have status property when response was passed to the constructor', () => {
    const err = new AxiosError('test', 'foo', {}, {}, { status: 400 });
    expect(err.status).toBe(400);
  });

  it('should have message property as enumerable for backward compatibility', () => {
      const err = new AxiosError('Test error message', 'ERR_TEST', {foo: 'bar'});

      // Test Object.keys() includes message
      const keys = Object.keys(err);
      expect(keys).toContain('message');

      // Test Object.entries() includes message
      const entries = Object.entries(err);
      const messageEntry = entries.find(([key]) => key === 'message');
      expect(messageEntry).toBeDefined();
      expect(messageEntry[1]).toBe('Test error message');

      // Test spread operator includes message
      const spread = {...err};
      expect(spread.message).toBe('Test error message');

      // Verify message descriptor is enumerable
      const descriptor = Object.getOwnPropertyDescriptor(err, 'message');
      expect(descriptor.enumerable).toBe(true);
  });
});
