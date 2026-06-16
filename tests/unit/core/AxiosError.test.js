import { describe, it, expect } from 'vitest';
import { isNativeError } from 'node:util/types';
import AxiosError from '../../../lib/core/AxiosError.js';
import AxiosHeaders from '../../../lib/core/AxiosHeaders.js';

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
    // request/response are intentionally omitted from the serialized shape
    // to avoid circular-reference problems.
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);
    const json = error.toJSON();

    expect(json.message).toBe('Boom!');
    expect(json.config).toEqual({ foo: 'bar' });
    expect(json.code).toBe('ESOMETHING');
    expect(json.status).toBe(200);
    expect(json.request).toBeUndefined();
    expect(json.response).toBeUndefined();
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

  describe('cause serialization (regression #7205)', () => {
    // A wrapped low-level error carrying a circular reference, like a Node
    // socket/request held by network errors.
    const makeCircularCause = () => {
      const cause = new Error('socket hang up');
      cause.code = 'ECONNRESET';
      const socket = { name: 'Socket' };
      socket.self = socket; // circular
      cause.socket = socket;
      return cause;
    };

    it('sets `cause` as a non-enumerable own property (native Error parity)', () => {
      const axiosError = AxiosError.from(new Error('boom'), 'ERR_NETWORK', { url: '/x' });
      const descriptor = Object.getOwnPropertyDescriptor(axiosError, 'cause');

      expect(descriptor).toBeDefined();
      expect(descriptor.enumerable).toBe(false);
      expect(Object.keys(axiosError)).not.toContain('cause');
      expect('cause' in axiosError).toBe(true); // still discoverable via `in`
    });

    it('keeps `cause` fully accessible for debugging', () => {
      const original = makeCircularCause();
      const axiosError = AxiosError.from(original, 'ERR_NETWORK', { url: '/x' });

      expect(axiosError.cause).toBe(original);
      expect(axiosError.cause.code).toBe('ECONNRESET');
    });

    it('does not break structured loggers / own-property serialization', () => {
      const axiosError = AxiosError.from(makeCircularCause(), 'ERR_NETWORK', { url: '/x' });

      // pino/winston-style: enumerate own enumerable props and serialize.
      const loggerWalk = () =>
        JSON.stringify(Object.fromEntries(Object.entries(axiosError)));

      expect(loggerWalk).not.toThrow();
      expect(() => JSON.stringify(axiosError)).not.toThrow();
      expect(() => JSON.stringify({ wrapped: axiosError })).not.toThrow();
    });

    it('omits `cause` from toJSON() output', () => {
      const axiosError = AxiosError.from(makeCircularCause(), 'ERR_NETWORK', { url: '/x' });

      expect(axiosError.toJSON()).not.toHaveProperty('cause');
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

  describe('status field behaviour (issue #5330)', () => {
    it('error.status equals response.status for 4xx errors', () => {
      // Regression test: error.status must be directly accessible without
      // going through error.response.status.
      const error = new AxiosError(
        'Request failed with status code 404',
        AxiosError.ERR_BAD_REQUEST,
        {},
        {},
        { status: 404, statusText: 'Not Found' }
      );

      expect(error.status).toBe(404);
      expect(error.status).toBe(error.response.status);
    });

    it('error.status equals response.status for 5xx errors', () => {
      const error = new AxiosError(
        'Request failed with status code 503',
        AxiosError.ERR_BAD_RESPONSE,
        {},
        {},
        { status: 503, statusText: 'Service Unavailable' }
      );

      expect(error.status).toBe(503);
    });

    it('error.status is undefined when no response is provided (network errors)', () => {
      // Network errors (ECONNREFUSED, ETIMEDOUT, etc.) have no HTTP response,
      // so error.status must be undefined — not 0 or null.
      const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK, {}, {});

      expect(error.status).toBeUndefined();
      expect(error.response).toBeUndefined();
    });

    it('error.status is included in toJSON output', () => {
      const error = new AxiosError('test', 'ERR_BAD_REQUEST', {}, {}, { status: 401 });

      expect(error.toJSON().status).toBe(401);
    });
  });

  it('keeps message enumerable for backward compatibility', () => {
    const error = new AxiosError('Test error message', 'ERR_TEST', { foo: 'bar' });

    expect(Object.keys(error)).toContain('message');
    expect(Object.entries(error).find(([key]) => key === 'message')?.[1]).toBe('Test error message');
    expect({ ...error }.message).toBe('Test error message');
    expect(Object.getOwnPropertyDescriptor(error, 'message')?.enumerable).toBe(true);
  });

  // Opt-in redaction: when `config.redact` is an array of key names, every
  // matching key (case-insensitive, at any depth) has its value replaced with
  // the redaction marker in the toJSON snapshot. Undefined leaves the legacy
  // serialization untouched so existing consumers see no behavior change.
  describe('toJSON redaction via config.redact', () => {
    it('leaves config untouched when redact is undefined', () => {
      const config = {
        url: '/api',
        auth: { username: 'alice', password: 'secret' },
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();

      expect(json.config.auth.username).toBe('alice');
      expect(json.config.auth.password).toBe('secret');
    });

    it('ignores inherited redact accessors', () => {
      const prototype = {};
      Object.defineProperty(prototype, 'redact', {
        get() {
          throw new Error('inherited redact getter should not run');
        },
      });

      const config = Object.create(prototype);
      config.auth = { username: 'alice', password: 'secret' };
      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();

      expect(json.config.auth.username).toBe('alice');
      expect(json.config.auth.password).toBe('secret');
    });

    it('leaves config untouched when redact is an empty array', () => {
      const config = {
        auth: { username: 'alice', password: 'secret' },
        redact: [],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      expect(error.toJSON().config.auth.password).toBe('secret');
    });

    it('replaces top-level matching keys with the redaction marker', () => {
      const config = {
        url: '/api',
        auth: { username: 'alice', password: 'secret' },
        redact: ['auth'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();

      expect(json.config.url).toBe('/api');
      expect(json.config.auth).toBe('[REDACTED ****]');
    });

    it('replaces matching keys at any nesting depth', () => {
      const config = {
        auth: { username: 'alice', password: 'secret' },
        proxy: { auth: { username: 'pu', password: 'pp' } },
        redact: ['password'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();

      expect(json.config.auth.username).toBe('alice');
      expect(json.config.auth.password).toBe('[REDACTED ****]');
      expect(json.config.proxy.auth.password).toBe('[REDACTED ****]');
      expect(json.config.proxy.auth.username).toBe('pu');
    });

    it('matches case-insensitively', () => {
      const config = {
        headers: { Authorization: 'Bearer abc' },
        redact: ['authorization'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      expect(error.toJSON().config.headers.Authorization).toBe('[REDACTED ****]');
    });

    it('redacts headers stored in an AxiosHeaders instance', () => {
      const headers = new AxiosHeaders();
      headers.set('Authorization', 'Bearer abc');
      headers.set('X-Trace', 'trace-id');

      const config = { headers, redact: ['Authorization'] };
      const error = new AxiosError('Boom', 'ECODE', config);

      const serialized = error.toJSON().config.headers;
      expect(serialized.Authorization).toBe('[REDACTED ****]');
      expect(serialized['X-Trace']).toBe('trace-id');
    });

    it('redacts inside arrays of objects', () => {
      const config = {
        items: [{ token: 't1' }, { token: 't2', name: 'keep' }],
        redact: ['token'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();
      expect(json.config.items[0].token).toBe('[REDACTED ****]');
      expect(json.config.items[1].token).toBe('[REDACTED ****]');
      expect(json.config.items[1].name).toBe('keep');
    });

    it('does not crash on circular config references', () => {
      const config = { auth: { password: 'secret' }, redact: ['password'] };
      config.self = config;

      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();
      expect(json.config.auth.password).toBe('[REDACTED ****]');
      expect(Object.prototype.hasOwnProperty.call(json.config, 'self')).toBe(false);
    });

    it('preserves legacy toJSONObject handling for values with toJSON', () => {
      const issuedAt = new Date('2026-01-01T00:00:00.000Z');
      const endpoint = new URL('https://example.com/users');
      const config = {
        issuedAt,
        endpoint,
        auth: { password: 'secret' },
        redact: ['password'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      const json = error.toJSON();

      expect(json.config.issuedAt).toBe(issuedAt);
      expect(json.config.endpoint).toBe(endpoint);
      expect(json.config.auth.password).toBe('[REDACTED ****]');
    });

    it('does not let a polluted Object.prototype.toJSON bypass redaction', () => {
      class Credentials {
        constructor() {
          this.password = 'secret';
        }
      }

      Object.prototype.toJSON = function () {
        return this;
      };

      const config = {
        auth: { password: 'secret' },
        credentials: new Credentials(),
        items: [{ token: 't1' }],
        redact: ['password', 'token'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      try {
        const json = error.toJSON();

        expect(json.config.auth.password).toBe('[REDACTED ****]');
        expect(json.config.credentials.password).toBe('[REDACTED ****]');
        expect(json.config.items[0].token).toBe('[REDACTED ****]');
      } finally {
        delete Object.prototype.toJSON;
      }
    });

    it('copies __proto__ as data without changing the redaction output prototype', () => {
      const config = { redact: ['password'] };
      Object.defineProperty(config, '__proto__', {
        value: { password: 'secret' },
        enumerable: true,
        configurable: true,
      });

      const error = new AxiosError('Boom', 'ECODE', config);
      const json = error.toJSON();

      expect(Object.getPrototypeOf(json.config)).toBe(null);
      expect(Object.prototype.hasOwnProperty.call(json.config, '__proto__')).toBe(true);
      expect(json.config.__proto__.password).toBe('[REDACTED ****]');
    });

    it('does not mutate the original config or AxiosHeaders', () => {
      const headers = new AxiosHeaders();
      headers.set('Authorization', 'Bearer abc');

      const config = {
        auth: { username: 'alice', password: 'secret' },
        headers,
        redact: ['password', 'Authorization'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      error.toJSON();

      expect(config.auth.password).toBe('secret');
      expect(headers.get('Authorization')).toBe('Bearer abc');
    });

    it('keeps the redact array itself visible in the snapshot', () => {
      const config = {
        auth: { password: 'secret' },
        redact: ['password'],
      };
      const error = new AxiosError('Boom', 'ECODE', config);

      // Useful for debugging — operators can see what was being redacted.
      expect(error.toJSON().config.redact).toEqual(['password']);
    });
  });
});
