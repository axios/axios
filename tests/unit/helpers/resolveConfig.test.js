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
});
