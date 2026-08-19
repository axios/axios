import { describe, it } from 'vitest';
import assert from 'assert';
import estimateDataURLDecodedBytes, {
  estimateDataURLBufferAllocation,
} from '../../lib/helpers/estimateDataURLDecodedBytes.js';

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

  it('should ignore URL fragments when estimating a Fetch payload', () => {
    const url = 'data:text/plain;base64,TQ==#' + 'x'.repeat(4096);

    assert.strictEqual(estimateDataURLDecodedBytes(url), 1);
  });

  it('should include the remainder after percent-decoding a Fetch base64 body', () => {
    const body = 'QQ' + '%41'.repeat(4000);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(estimateDataURLDecodedBytes(url), 3001);
  });

  it('should estimate the raw Buffer allocation for percent-embedded base64', () => {
    const body = 'QQ' + '%41'.repeat(4000);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(
      estimateDataURLBufferAllocation(url),
      Buffer.byteLength(body, 'base64')
    );
    assert.ok(estimateDataURLBufferAllocation(url) > Buffer.from(body, 'base64').length);
  });

  it('should include ignored input after padding in the raw Buffer allocation', () => {
    const body = 'TQ==' + '%'.repeat(4096);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(
      estimateDataURLBufferAllocation(url),
      Buffer.byteLength(body, 'base64')
    );
    assert.ok(estimateDataURLBufferAllocation(url) > Buffer.from(body, 'base64').length);
  });

  it('should include fragments in the raw Buffer allocation', () => {
    const body = 'TQ==#' + 'x'.repeat(4096);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(
      estimateDataURLBufferAllocation(url),
      Buffer.byteLength(body, 'base64')
    );
  });
});
