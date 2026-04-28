import { describe, it } from 'vitest';
import assert from 'assert';
import fromDataURI from '../../lib/helpers/fromDataURI.js';

describe('helpers::fromDataURI', () => {
  it('should return buffer from data uri', () => {
    const buffer = Buffer.from('123');

    const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should handle data URI with no media type (data:;base64,...)', () => {
    const buffer = Buffer.from('123');
    const dataURI = 'data:;base64,' + buffer.toString('base64');
    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should handle data URI with media type and no parameters (data:type/subtype,...)', () => {
    const body = '123';
    const dataURI = 'data:application/octet-stream,' + encodeURIComponent(body);
    assert.deepStrictEqual(fromDataURI(dataURI, false), Buffer.from(body));
  });

  it('should handle data URI with non-base64 media type parameters (data:type/subtype;param=value,...)', () => {
    const body = '123';
    const dataURI = 'data:text/plain;charset=US-ASCII,' + encodeURIComponent(body);
    assert.deepStrictEqual(fromDataURI(dataURI, false), Buffer.from(body));
  });
});
