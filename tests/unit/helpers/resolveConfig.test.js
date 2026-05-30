import { describe, it } from 'vitest';
import assert from 'assert';
import resolveConfig from '../../../lib/helpers/resolveConfig.js';

class ReactNativeFormData {
  append() {}

  getParts() {
    return [];
  }

  get [Symbol.toStringTag]() {
    return 'FormData';
  }
}

const encodeUTF8 = (str) =>
  encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

describe('helpers::resolveConfig', () => {
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

  it('should encode basic auth credentials with UTF-8', () => {
    const config = resolveConfig({
      url: '/resource',
      auth: {
        username: '用户',
        password: 'pässwörd',
      },
      headers: {},
    });

    const expected = 'Basic ' + btoa(`${encodeUTF8('用户')}:${encodeUTF8('pässwörd')}`);

    assert.strictEqual(config.headers.get('Authorization'), expected);
  });
});
