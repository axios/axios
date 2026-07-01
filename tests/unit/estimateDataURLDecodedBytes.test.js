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
    // Node's Buffer.from(body, 'base64') decodes the raw body and does NOT
    // percent-decode, so `%3D` is not padding: the '%' is dropped and `3D`
    // decode as ordinary base64 data. The estimate must match that (any lower
    // value would let maxContentLength be bypassed).
    const url = 'data:text/plain;base64,TQ%3D%3D';
    assert.strictEqual(estimateDataURLDecodedBytes(url), Buffer.from('TQ%3D%3D', 'base64').length);
  });

  it('must not under-report base64 bodies that embed percent signs (maxContentLength guard)', () => {
    // Regression for a maxContentLength bypass: a '%XX' triplet whose hex
    // digits are valid base64 characters (e.g. `%41` -> `41`) was wrongly
    // treated as consumed by percent-decoding and subtracted, yielding a ~2x
    // under-estimate that defeated the data: URL DoS guard (CVE-2025-58754).
    const body = 'QQ' + '%41'.repeat(4000);
    const url = 'data:application/octet-stream;base64,' + body;
    const actual = Buffer.from(body, 'base64').length;
    assert.ok(estimateDataURLDecodedBytes(url) >= actual);
    assert.strictEqual(estimateDataURLDecodedBytes(url), actual);
  });
});
