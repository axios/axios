var AxiosError = require('../../../lib/core/AxiosError');

describe('core::AxiosError', function() {
  it('should create an Error with message, config, code, request, response, stack and isAxiosError', function() {
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };
    var error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.isAxiosError).toBe(true);
    expect(error.stack).toBeDefined();
  });
  it('should create an Error that can be serialized to JSON', function() {
    // Attempting to serialize request and response results in
    //    TypeError: Converting circular structure to JSON
    var request = { path: '/foo' };
    var response = { status: 200, data: { foo: 'bar' } };
    var error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);
    var json = error.toJSON();
    expect(json.message).toBe('Boom!');
    expect(json.config).toEqual({ foo: 'bar' });
    expect(json.code).toBe('ESOMETHING');
    expect(json.status).toBe(200);
    expect(json.request).toBe(undefined);
    expect(json.response).toBe(undefined);
  });

  it('should redact default sensitive config keys when serialized to JSON', function() {
    var config = {
      url: '/foo',
      headers: {
        Authorization: 'Bearer secret-token',
        'Proxy-Authorization': 'Basic proxy-secret',
        Cookie: 'sid=secret-cookie',
        'Set-Cookie': 'sid=set-cookie-secret',
        'X-API-Key': 'secret-api-key',
        Accept: 'application/json'
      },
      auth: {
        username: 'janedoe',
        password: 's00pers3cret'
      },
      params: {
        page: 1
      }
    };
    var error = new AxiosError('Boom!', 'ESOMETHING', config);
    var json = error.toJSON();

    expect(json.config.headers.Authorization).toBe('[REDACTED ****]');
    expect(json.config.headers['Proxy-Authorization']).toBe('[REDACTED ****]');
    expect(json.config.headers.Cookie).toBe('[REDACTED ****]');
    expect(json.config.headers['Set-Cookie']).toBe('[REDACTED ****]');
    expect(json.config.headers['X-API-Key']).toBe('[REDACTED ****]');
    expect(json.config.auth.password).toBe('[REDACTED ****]');
    expect(json.config.url).toBe('/foo');
    expect(json.config.headers.Accept).toBe('application/json');
    expect(json.config.auth.username).toBe('janedoe');
    expect(json.config.params.page).toBe(1);
  });

  it('should omit redacted plaintext values from JSON.stringify output', function() {
    var error = new AxiosError('Boom!', 'ESOMETHING', {
      headers: {
        Authorization: 'Bearer stringify-token',
        'Proxy-Authorization': 'Basic stringify-proxy',
        Cookie: 'sid=stringify-cookie',
        'Set-Cookie': 'sid=stringify-set-cookie',
        'X-API-Key': 'stringify-api-key'
      },
      auth: {
        password: 'stringify-password'
      }
    });
    var serialized = JSON.stringify(error);

    expect(serialized).not.toContain('Bearer stringify-token');
    expect(serialized).not.toContain('Basic stringify-proxy');
    expect(serialized).not.toContain('sid=stringify-cookie');
    expect(serialized).not.toContain('sid=stringify-set-cookie');
    expect(serialized).not.toContain('stringify-api-key');
    expect(serialized).not.toContain('stringify-password');
    expect(serialized).toContain('[REDACTED ****]');
  });

  it('should redact matching config keys recursively and case-insensitively', function() {
    var error = new AxiosError('Boom!', 'ESOMETHING', {
      headers: {
        Authorization: 'Bearer token',
        cOoKiE: 'mixed-case-cookie',
        common: {
          authorization: 'Common token',
          'x-api-key': 'Common API key',
          Accept: 'application/json'
        },
        get: {
          'Proxy-Authorization': 'GET proxy token',
          'Content-Type': 'application/json'
        }
      },
      auth: {
        Password: 'Secret password'
      }
    });
    var json = error.toJSON();

    expect(json.config.headers.Authorization).toBe('[REDACTED ****]');
    expect(json.config.headers.cOoKiE).toBe('[REDACTED ****]');
    expect(json.config.headers.common.authorization).toBe('[REDACTED ****]');
    expect(json.config.headers.common['x-api-key']).toBe('[REDACTED ****]');
    expect(json.config.headers.common.Accept).toBe('application/json');
    expect(json.config.headers.get['Proxy-Authorization']).toBe('[REDACTED ****]');
    expect(json.config.headers.get['Content-Type']).toBe('application/json');
    expect(json.config.auth.Password).toBe('[REDACTED ****]');
  });

  it('should use custom config redact keys with exact key matching', function() {
    var error = new AxiosError('Boom!', 'ESOMETHING', {
      redact: ['apiKey'],
      apiKey: 'secret-api-key',
      password: 'not-redacted-by-custom-list',
      passwordHint: 'first pet'
    });
    var json = error.toJSON();

    expect(json.config.apiKey).toBe('[REDACTED ****]');
    expect(json.config.password).toBe('not-redacted-by-custom-list');
    expect(json.config.passwordHint).toBe('first pet');
  });

  it('should not mutate error config while redacting serialized output', function() {
    var config = {
      headers: {
        Authorization: 'Bearer original-token',
        Cookie: 'sid=original-cookie',
        common: {
          'X-API-Key': 'original-api-key'
        }
      },
      auth: {
        password: 'original-password'
      }
    };
    var error = new AxiosError('Boom!', 'ESOMETHING', config);

    error.toJSON();
    JSON.stringify(error);

    expect(error.config).toBe(config);
    expect(error.config.headers.Authorization).toBe('Bearer original-token');
    expect(error.config.headers.Cookie).toBe('sid=original-cookie');
    expect(error.config.headers.common['X-API-Key']).toBe('original-api-key');
    expect(error.config.auth.password).toBe('original-password');
  });

  it('should not infinite-loop when the config contains a cycle', function() {
    var config = {
      url: '/foo',
      headers: {
        Authorization: 'Bearer secret-token'
      }
    };
    config.self = config;
    config.headers.parent = config;

    var error = new AxiosError('Boom!', 'ESOMETHING', config);
    var json;

    expect(function() {
      json = error.toJSON();
    }).not.toThrow();

    expect(json.config.url).toBe('/foo');
    expect(json.config.headers.Authorization).toBe('[REDACTED ****]');
    expect(json.config.self).toBe('[Circular]');
    expect(json.config.headers.parent).toBe('[Circular]');
  });

  it('should not flag shared-but-acyclic config branches as circular', function() {
    var shared = { kind: 'shared' };
    var error = new AxiosError('Boom!', 'ESOMETHING', {
      first: shared,
      second: shared
    });
    var json = error.toJSON();

    expect(json.config.first).toEqual({ kind: 'shared' });
    expect(json.config.second).toEqual({ kind: 'shared' });
    expect(json.config.first).not.toBe(shared);
    expect(json.config.second).not.toBe(shared);
  });

  describe('core::createError.from', function() {
    it('should add config, config, request and response to error', function() {
      var error = new Error('Boom!');
      var request = { path: '/foo' };
      var response = { status: 200, data: { foo: 'bar' } };

      var axiosError = AxiosError.from(error, 'ESOMETHING', { foo: 'bar' },  request, response);
      expect(axiosError.config).toEqual({ foo: 'bar' });
      expect(axiosError.code).toBe('ESOMETHING');
      expect(axiosError.request).toBe(request);
      expect(axiosError.response).toBe(response);
      expect(axiosError.isAxiosError).toBe(true);
    });

    it('should return error', function() {
      var error = new Error('Boom!');
      expect(AxiosError.from(error, 'ESOMETHING', { foo: 'bar' }) instanceof AxiosError).toBeTruthy();
    });
  });
});
