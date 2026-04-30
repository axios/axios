import { describe, it } from 'vitest';
import assert from 'assert';
import fromDataURI from '../../lib/helpers/fromDataURI.js';

describe('helpers::fromDataURI', () => {
  it('should return buffer from data uri', () => {
    const buffer = Buffer.from('123');

    const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
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

  it('should reject invalid URI without data protocol', () => {
    assert.throws(() => {
      fromDataURI('notadata:uri', false);
    });
  });
});
