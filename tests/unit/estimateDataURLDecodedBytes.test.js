import { describe, it } from 'vitest';
import assert from 'assert';
import estimateDataURLDecodedBytes, {
  estimateDataURLBufferAllocation,
} from '../../lib/helpers/estimateDataURLDecodedBytes.js';

describe('estimateDataURLDecodedBytes', () => {
  it('should return 0 for non-data URLs', () => {
    assert.strictEqual(estimateDataURLDecodedBytes('http://example.com'), 0);
  });

  it('should recognize case-insensitive data protocols for both decoders', () => {
    ['data:', 'DATA:', 'DaTa:'].forEach((scheme) => {
      assert.strictEqual(estimateDataURLBufferAllocation(scheme + 'text/plain,payload'), 7);
      assert.strictEqual(estimateDataURLDecodedBytes(scheme + 'text/plain,payload'), 7);
    });
  });

  it.each(['datax:,payload', 'DATAX:,payload', 'data-without-colon,payload', '', null])(
    'should not estimate unsupported data protocol prefixes: %s',
    (url) => {
      assert.strictEqual(estimateDataURLBufferAllocation(url), 0);
    }
  );

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

  it.each(['base64', 'BASE64', 'bAsE64'])(
    'should estimate the Buffer allocation for a %s marker',
    (marker) => {
      const url = 'data:text/plain;' + marker + ',SGVsbG8=';

      assert.strictEqual(estimateDataURLBufferAllocation(url), 5);
    }
  );

  it.each(['BASE64=x', 'name=BASE64'])(
    'should estimate %s as a non-base64 media type parameter',
    (parameter) => {
      const body = '\u4e00'.repeat(4);
      const url = 'data:text/plain;' + parameter + ',' + body;

      assert.strictEqual(estimateDataURLBufferAllocation(url), Buffer.byteLength(body));
    }
  );

  it.each(['base64', 'BASE64', 'bAsE64'])(
    'should use the percent-decoded allocation for a %s marker',
    (marker) => {
      const body = '%41'.repeat(4096);
      const url = 'data:text/plain;' + marker + ',' + body;

      const decoded = decodeURIComponent(body);
      assert.strictEqual(
        estimateDataURLBufferAllocation(url),
        Buffer.byteLength(decoded, 'base64')
      );
      assert.ok(estimateDataURLBufferAllocation(url) >= Buffer.from(decoded, 'base64').length);
    }
  );

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

  it('should estimate the percent-decoded Buffer allocation for percent-embedded base64', () => {
    const body = 'QQ' + '%41'.repeat(4000);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(
      estimateDataURLBufferAllocation(url),
      Buffer.byteLength('QQ' + 'A'.repeat(4000), 'base64')
    );
    assert.strictEqual(estimateDataURLBufferAllocation(url), 3001);
  });

  it.each([
    ['padding', 'TQ%3d%3D', 'TQ=='],
    ['fully encoded', '%54%51%3D%3D', 'TQ=='],
    ['whitespace', 'T%0AQ%3D%3D', 'T\nQ=='],
    ['ignored tail', 'TQ%3D%3D' + '%25'.repeat(4096), 'TQ==' + '%'.repeat(4096)],
    ['incomplete escape', 'TQ%3D%3D%', 'TQ==%'],
  ])('should bound Buffer allocation for encoded %s', (_name, encoded, decoded) => {
    const estimate = estimateDataURLBufferAllocation('data:;base64,' + encoded);
    assert.strictEqual(estimate, Buffer.byteLength(decoded, 'base64'));
    assert.ok(estimate >= Buffer.from(decoded, 'base64').length);
  });

  it('should include ignored input after padding in the raw Buffer allocation', () => {
    const body = 'TQ==' + '%'.repeat(4096);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(estimateDataURLBufferAllocation(url), Buffer.byteLength(body, 'base64'));
    assert.ok(estimateDataURLBufferAllocation(url) > Buffer.from(body, 'base64').length);
  });

  it('should include fragments in the raw Buffer allocation', () => {
    const body = 'TQ==#' + 'x'.repeat(4096);
    const url = 'data:application/octet-stream;base64,' + body;

    assert.strictEqual(estimateDataURLBufferAllocation(url), Buffer.byteLength(body, 'base64'));
  });
});
