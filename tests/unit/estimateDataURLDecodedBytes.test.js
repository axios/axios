import { describe, it } from 'vitest';
import assert from 'assert';
import estimateDataURLDecodedBytes from '../../lib/helpers/estimateDataURLDecodedBytes.js';

describe('estimateDataURLDecodedBytes', () => {
  it('should return 0 for non-data URLs', () => {
    assert.strictEqual(estimateDataURLDecodedBytes('http://example.com'), 0);
  });

  it('should calculate length for simple non-base64 data URL', () => {
    const url = 'data:,Hello';
    assert.strictEqual(estimateDataURLDecodedBytes(url), Buffer.byteLength('Hello', 'utf8'));
  });

  it('should calculate decoded length for percent-encoded non-base64 data URL', () => {
    const url = 'data:text/plain,%E2%82%AC';
    assert.strictEqual(estimateDataURLDecodedBytes(url), Buffer.byteLength('\u20ac', 'utf8'));
  });

  it('should count percent-encoded ASCII as one decoded byte', () => {
    const url = 'data:text/plain,hello%20world';
    assert.strictEqual(estimateDataURLDecodedBytes(url), Buffer.byteLength('hello world', 'utf8'));
  });

  it('should calculate decoded length for base64 data URL', () => {
    const str = 'Hello';
    const b64 = Buffer.from(str, 'utf8').toString('base64');
    const url = `data:text/plain;base64,${b64}`;
    assert.strictEqual(estimateDataURLDecodedBytes(url), str.length);
  });

  it('should handle base64 with = padding', () => {
    const url = 'data:text/plain;base64,TQ==';
    assert.strictEqual(estimateDataURLDecodedBytes(url), 1);
  });

  it('should handle base64 with %3D padding', () => {
    const url = 'data:text/plain;base64,TQ%3D%3D';
    assert.strictEqual(estimateDataURLDecodedBytes(url), 1);
  });
});
