import assert from 'assert';
import fromDataURI from '../../../lib/helpers/fromDataURI.js';

describe('helpers::fromDataURI', function () {
  it('should return buffer from data uri', function () {
    const buffer= Buffer.from('123');

    const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse data URI with no mediatype and base64', function () {
    const buffer = Buffer.from('123');
    const dataURI = 'data:;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse data URI with mediatype and no base64', function () {
    const buffer = Buffer.from('123');
    const dataURI = 'data:application/octet-stream,123';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse full form data URI with text/plain and base64', function () {
    const buffer = Buffer.from('hello');
    const dataURI = 'data:text/plain;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse minimal valid data URI', function () {
    const buffer = Buffer.from('');
    const dataURI = 'data:,';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should parse data URI with spaces in data', function () {
    const buffer = Buffer.from('hello world');
    const dataURI = 'data:text/plain,hello world';

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });

  it('should reject invalid URI without data protocol', function () {
    assert.throws(function () {
      fromDataURI('notadata:uri', false);
    });
  });
});
