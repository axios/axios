import { describe, it } from 'vitest';
import assert from 'assert';
import estimateDataURLDecodedBytes from '../../lib/helpers/estimateDataURLDecodedBytes.js';

describe('estimateDataURLDecodedBytes', function () {
  it('should return 0 for non-data URLs', function () {
    assert.strictEqual(estimateDataURLDecodedBytes('http://example.com'), 0);
  });

  it('should calculate length for simple non-base64 data URL', function () {
    const url = 'data:,Hello';
    assert.strictEqual(estimateDataURLDecodedBytes(url), Buffer.byteLength('Hello', 'utf8'));
  });

  it('should calculate decoded length for base64 data URL', function () {
    const str = 'Hello';
    const b64 = Buffer.from(str, 'utf8').toString('base64');
    const url = `data:text/plain;base64,${b64}`;
    assert.strictEqual(estimateDataURLDecodedBytes(url), str.length);
  });

  it('should handle base64 with = padding', function () {
    const url = 'data:text/plain;base64,TQ==';
    assert.strictEqual(estimateDataURLDecodedBytes(url), 1);
  });

  it('should handle base64 with %3D padding', function () {
    const url = 'data:text/plain;base64,TQ%3D%3D';
    assert.strictEqual(estimateDataURLDecodedBytes(url), 1);
  });
});
