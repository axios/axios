import { describe, it } from 'vitest';
import assert from 'assert';
import fromDataURI from '../../lib/helpers/fromDataURI.js';

describe('helpers::fromDataURI', () => {
  it('should return buffer from data uri', () => {
    const buffer = Buffer.from('123');

    const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should not call decodeURIComponent for base64 data', () => {
    const buffer = Buffer.from('123');
    const originalDecodeURIComponent = globalThis.decodeURIComponent;
    globalThis.decodeURIComponent = () => {
      throw new Error('base64 body should not be URL decoded');
    };

    try {
      const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

      assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
    } finally {
      globalThis.decodeURIComponent = originalDecodeURIComponent;
    }
  });

  it('should parse data URI with no mediatype and base64', () => {
    const buffer = Buffer.from('123');
    const dataURI = 'data:;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse data URI with mediatype and no base64', () => {
    const buffer = Buffer.from('123');
    const dataURI = 'data:application/octet-stream,123';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse full form data URI with text/plain and base64', () => {
    const buffer = Buffer.from('hello');
    const dataURI = 'data:text/plain;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse minimal valid data URI', () => {
    const buffer = Buffer.from('');
    const dataURI = 'data:,';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse data URI with spaces in data', () => {
    const buffer = Buffer.from('hello world');
    const dataURI = 'data:text/plain,hello world';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse canonical RFC example with charset parameter', () => {
    const buffer = Buffer.from('123');
    const dataURI = 'data:text/plain;charset=US-ASCII,123';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should decode URL-encoded body', () => {
    const buffer = Buffer.from('hello world');
    const dataURI = 'data:text/plain,hello%20world';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should preserve full content type with parameters in Blob', () => {
    const dataURI = 'data:text/plain;charset=utf-8;base64,' + Buffer.from('hello').toString('base64');
    const blob = fromDataURI(dataURI, true, { Blob });

    assert.strictEqual(blob.type, 'text/plain;charset=utf-8');
  });

  it('should normalize omitted mediatype to text/plain per RFC 2397', () => {
    const dataURI = 'data:;charset=UTF-8,hello';
    const blob = fromDataURI(dataURI, true, { Blob });

    assert.strictEqual(blob.type, 'text/plain;charset=utf-8');
  });

  it('should reject data URI with unsupported protocol prefix', () => {
    assert.throws(() => {
      fromDataURI('datax:,hi', false);
    }, (err) => err.code === 'ERR_NOT_SUPPORT' && err.message.includes('Unsupported protocol'));
  });

  it('should reject data URI without comma separator', () => {
    assert.throws(() => {
      fromDataURI('data:hi', false);
    }, (err) => err.code === 'ERR_INVALID_URL');
  });
});
