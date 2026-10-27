import { describe, it } from 'vitest';
import assert from 'assert';
import FormData from 'form-data';
import resolveConfig from '../../../lib/helpers/resolveConfig.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import CanceledError from '../../../lib/cancel/CanceledError.js';
import isCancel from '../../../lib/cancel/isCancel.js';

class ReactNativeFormData {
  append() {}

  getParts() {
    return [];
  }

  get [Symbol.toStringTag]() {
    return 'FormData';
  }
}

describe('helpers::resolveConfig', () => {
  it('should ignore FormData getHeaders inherited only from Object.prototype', () => {
    if (typeof globalThis.FormData !== 'function') {
      return;
    }

    let called = false;
    Object.prototype.getHeaders = () => {
      called = true;
      return { 'X-Injected': 'yes' };
    };

    try {
      const config = resolveConfig({
        url: '/upload',
        data: new globalThis.FormData(),
      });

      assert.strictEqual(called, false);
      assert.strictEqual(config.headers.get('X-Injected'), undefined);
    } finally {
      delete Object.prototype.getHeaders;
    }
  });

  it('clears Content-Type for React Native FormData', () => {
    const data = new ReactNativeFormData();
    const config = resolveConfig({
      url: '/upload',
      data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    assert.strictEqual(config.data, data);
    assert.strictEqual(config.headers.getContentType(), undefined);
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(config.headers.toJSON(), 'Content-Type'),
      false
    );
  });

  it('should ignore inherited nested auth fields', () => {
    Object.defineProperty(Object.prototype, 'username', {
      value: 'inherited-user',
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'password', {
      value: 'inherited-pass',
      configurable: true,
    });

    try {
      const config = resolveConfig({
        url: '/foo',
        auth: {},
      });

      assert.strictEqual(config.headers.get('Authorization'), 'Basic Og==');
    } finally {
      delete Object.prototype.username;
      delete Object.prototype.password;
    }
  });

  it('should UTF-8 encode both basic auth fields when opted in', () => {
    const config = resolveConfig({
      url: '/foo',
      auth: { username: 'naïve', password: 'naïve' },
      transitional: { encodeBasicAuthUsername: true },
    });

    const decoded = Buffer.from(
      config.headers.get('Authorization').replace(/^Basic /, ''),
      'base64'
    ).toString('utf8');
    assert.strictEqual(decoded, 'naïve:naïve');
  });

  it('should accept a basic auth username outside Latin-1 when opted in', () => {
    let config;
    assert.doesNotThrow(() => {
      config = resolveConfig({
        url: '/foo',
        auth: { username: 'π', password: 'x' },
        transitional: { encodeBasicAuthUsername: true },
      });
    });

    const decoded = Buffer.from(
      config.headers.get('Authorization').replace(/^Basic /, ''),
      'base64'
    ).toString('utf8');
    assert.strictEqual(decoded, 'π:x');
  });

  it.each([undefined, false])(
    'should preserve Latin-1 username bytes with opt-in %s',
    (enabled) => {
      const config = resolveConfig({
        url: '/foo',
        auth: { username: 'naïve', password: 'x' },
        transitional: { encodeBasicAuthUsername: enabled },
      });

      assert.strictEqual(config.headers.get('Authorization'), 'Basic bmHvdmU6eA==');
    }
  );

  it('should preserve manually UTF-8 encoded usernames by default', () => {
    const config = resolveConfig({
      url: '/foo',
      auth: { username: 'na\u00c3\u00afve', password: 'x' },
    });

    assert.strictEqual(config.headers.get('Authorization'), 'Basic bmHDr3ZlOng=');
  });

  it.each(['transitional', 'encodeBasicAuthUsername'])(
    'should ignore an inherited %s opt-in',
    (key) => {
      Object.defineProperty(Object.prototype, key, {
        value: key === 'transitional' ? { encodeBasicAuthUsername: true } : true,
        configurable: true,
        writable: true,
      });

      try {
        const config = resolveConfig({
          url: '/foo',
          auth: { username: 'naïve', password: 'x' },
          ...(key === 'encodeBasicAuthUsername' ? { transitional: {} } : {}),
        });

        assert.strictEqual(config.headers.get('Authorization'), 'Basic bmHvdmU6eA==');
      } finally {
        delete Object.prototype[key];
      }
    }
  );

  it.each([
    [{ username: 'Aladdin', password: 'open sesame' }, 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='],
    [{}, 'Basic Og=='],
    [{ username: 'π' }, 'Basic z4A6'],
    [{ password: 'π' }, 'Basic Os+A'],
    [{ username: '😀', password: 'x' }, 'Basic 8J+YgDp4'],
  ])('should encode valid credentials %j when opted in', (auth, expected) => {
    const config = resolveConfig({
      url: '/foo',
      auth,
      transitional: { encodeBasicAuthUsername: true },
    });

    assert.strictEqual(config.headers.get('Authorization'), expected);
  });

  it.each(['username', 'password'])('should reject a lone surrogate in %s when opted in', (key) => {
    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          auth: { username: 'user', password: 'x', [key]: '\uD800' },
          transitional: { encodeBasicAuthUsername: true },
        }),
      (error) => error instanceof AxiosError && error.code === AxiosError.ERR_BAD_OPTION_VALUE
    );
  });

  it('should wrap invalid auth encoding as AxiosError', () => {
    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          auth: {
            username: 'user',
            password: '\uD800',
          },
        }),
      (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
        return true;
      }
    );
  });

  it('should keep the code of param serialization failures that are already AxiosErrors', () => {
    // Build params nested deeper than toFormData's default depth limit (100).
    let params = {};
    for (let i = 0; i < 105; i++) {
      params = { nested: params };
    }

    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          params,
        }),
      (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED);
        assert.strictEqual(err.config.url, '/foo');
        return true;
      }
    );
  });

  it('should assign ERR_BAD_REQUEST to uncoded AxiosErrors thrown by a custom paramsSerializer', () => {
    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          params: { a: 1 },
          paramsSerializer: () => {
            throw new AxiosError('serializer failed');
          },
        }),
      (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_BAD_REQUEST);
        assert.strictEqual(err.message, 'serializer failed');
        assert.strictEqual(err.config.url, '/foo');
        return true;
      }
    );
  });

  it('should rethrow a CanceledError thrown by a custom paramsSerializer unchanged', () => {
    const canceled = new CanceledError('stop');

    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          params: { a: 1 },
          paramsSerializer: () => {
            throw canceled;
          },
        }),
      (err) => {
        assert.strictEqual(err, canceled);
        assert.ok(isCancel(err));
        return true;
      }
    );
  });

  it('should rethrow nullish values thrown by a custom paramsSerializer unchanged', () => {
    for (const value of [null, undefined]) {
      let thrown;

      try {
        resolveConfig({
          url: '/foo',
          params: { a: 1 },
          paramsSerializer: () => {
            throw value;
          },
        });
      } catch (err) {
        thrown = { err };
      }

      assert.ok(thrown);
      assert.strictEqual(thrown.err, value);
    }
  });

  it('should wrap param serialization failures as AxiosError', () => {
    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          params: {
            value: '\uD800',
          },
        }),
      (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_BAD_REQUEST);
        return true;
      }
    );
  });

  it('should wrap paramsSerializer failures as AxiosError', () => {
    assert.throws(
      () =>
        resolveConfig({
          url: '/foo',
          params: { value: 1 },
          paramsSerializer: () => {
            throw new Error('serializer failed');
          },
        }),
      (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_BAD_REQUEST);
        assert.strictEqual(err.message, 'serializer failed');
        return true;
      }
    );
  });

  it('should ignore null form-data headers with content-only policy', () => {
    const data = new FormData();
    data.getHeaders = () => null;

    const config = resolveConfig({
      url: '/upload',
      data,
      formDataHeaderPolicy: 'content-only',
      headers: {
        'X-Test': 'ok',
      },
    });

    assert.strictEqual(config.headers.get('X-Test'), 'ok');
  });

  it('should ignore inherited nested serializer fields', () => {
    let serializeInvoked = false;
    let encodeInvoked = false;

    Object.defineProperty(Object.prototype, 'serialize', {
      value() {
        serializeInvoked = true;
        return 'inherited=1';
      },
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'encode', {
      value() {
        encodeInvoked = true;
        return 'inherited';
      },
      configurable: true,
    });

    try {
      const config = resolveConfig({
        url: '/foo',
        params: { value: 'a b' },
        paramsSerializer: {},
      });

      assert.strictEqual(config.url, '/foo?value=a+b');
      assert.strictEqual(serializeInvoked, false);
      assert.strictEqual(encodeInvoked, false);
    } finally {
      delete Object.prototype.serialize;
      delete Object.prototype.encode;
    }
  });
});
