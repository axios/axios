import { describe, it, expect } from 'vitest';
import { isNativeError } from 'node:util/types';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('core::AxiosError', () => {
  it('creates an error with message, config, code, request, response, stack and isAxiosError', () => {
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.isAxiosError).toBe(true);
    expect(error.stack).toBeDefined();
  });

  it('serializes to JSON safely', () => {
    const request = { path: '/foo' };
    const response = { status: 200, statusText: 'OK', data: { foo: 'bar' }, headers: { 'content-type': 'application/json' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);
    const json = error.toJSON();

    expect(json.message).toBe('Boom!');
    expect(json.config).toEqual({ foo: 'bar' });
    expect(json.code).toBe('ESOMETHING');
    expect(json.status).toBe(200);
    expect(json.request).toBeUndefined();
    expect(json.response).toEqual({
      data: { foo: 'bar' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
    });
  });

  it('serializes response as null when no response is present', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK', { foo: 'bar' });
    const json = error.toJSON();

    expect(json.response).toBeNull();
  });

  it('serializes response without config or request to avoid circular references', () => {
    const config = { url: '/test' };
    const request = { path: '/test' };
    const response = {
      data: 'error body',
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'x-request-id': 'abc123' },
      config,
      request,
    };
    const error = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', config, request, response);
    const json = error.toJSON();

    // response should not include config or request (circular reference prevention)
    expect(json.response.config).toBeUndefined();
    expect(json.response.request).toBeUndefined();
    // but should include the useful fields
    expect(json.response.data).toBe('error body');
    expect(json.response.status).toBe(500);
    expect(json.response.statusText).toBe('Internal Server Error');
    expect(json.response.headers).toEqual({ 'x-request-id': 'abc123' });
  });

  it('produces JSON.stringify-safe output', () => {
    const config = { url: '/test' };
    const request = { path: '/test' };
    const response = {
      data: { message: 'Not Found' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config,
      request,
    };
    const error = new AxiosError('Not Found', 'ERR_BAD_REQUEST', config, request, response);

    expect(() => JSON.stringify(error.toJSON())).not.toThrow();
  });

  describe('AxiosError.from', () => {
    it('adds config, code, request and response to the wrapped error', () => {
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

    it('returns an AxiosError instance', () => {
      const axiosError = AxiosError.from(new Error('Boom!'), 'ESOMETHING', { foo: 'bar' });

      expect(axiosError).toBeInstanceOf(AxiosError);
    });

    it('preserves status from the original error when response is not provided', () => {
      const error = new Error('Network Error');
      error.status = 404;

      const axiosError = AxiosError.from(error, 'ERR_NETWORK', { foo: 'bar' });

      expect(axiosError.status).toBe(404);
    });

    it('prefers response.status over error.status when response is provided', () => {
      const error = new Error('Error');
      error.status = 500;
      const response = { status: 404 };

      const axiosError = AxiosError.from(error, 'ERR_BAD_REQUEST', {}, null, response);

      expect(axiosError.status).toBe(404);
    });
  });

  it('is recognized as a native error by Node util/types', () => {
    expect(isNativeError(new AxiosError('My Axios Error'))).toBe(true);
  });

  it('supports static error-code properties', () => {
    const error = new AxiosError('My Axios Error', AxiosError.ECONNABORTED);

    expect(error.code).toBe(AxiosError.ECONNABORTED);
  });

  it('sets status when response is passed to constructor', () => {
    const error = new AxiosError('test', 'foo', {}, {}, { status: 400 });

    expect(error.status).toBe(400);
  });

  it('keeps message enumerable for backward compatibility', () => {
    const error = new AxiosError('Test error message', 'ERR_TEST', { foo: 'bar' });

    expect(Object.keys(error)).toContain('message');
    expect(Object.entries(error).find(([key]) => key === 'message')?.[1]).toBe('Test error message');
    expect({ ...error }.message).toBe('Test error message');
    expect(Object.getOwnPropertyDescriptor(error, 'message')?.enumerable).toBe(true);
  });
});
