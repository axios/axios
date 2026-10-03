import { describe, it } from 'vitest';
import assert from 'assert';
import FormData from 'form-data';
import resolveConfig from '../../../lib/helpers/resolveConfig.js';
import AxiosError from '../../../lib/core/AxiosError.js';

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

  it('should UTF-8 encode a non-ASCII basic auth username, not just the password', () => {
    const config = resolveConfig({
      url: '/foo',
      auth: { username: 'naïve', password: 'naïve' },
    });

    const decoded = Buffer.from(
      config.headers.get('Authorization').replace(/^Basic /, ''),
      'base64'
    ).toString('utf8');
    assert.strictEqual(decoded, 'naïve:naïve');
  });

  it('should not throw for a basic auth username outside Latin-1', () => {
    let config;
    assert.doesNotThrow(() => {
      config = resolveConfig({
        url: '/foo',
        auth: { username: 'π', password: 'x' },
      });
    });

    const decoded = Buffer.from(
      config.headers.get('Authorization').replace(/^Basic /, ''),
      'base64'
    ).toString('utf8');
    assert.strictEqual(decoded, 'π:x');
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
