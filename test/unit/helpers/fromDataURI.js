import assert from 'assert';
import fromDataURI from '../../../lib/helpers/fromDataURI.js';

describe('helpers::fromDataURI', function () {
  for (const isBase64 of [true, false]) {
    const base64Suffix = isBase64 ? ';base64' : '';
    const toStringEncoding = isBase64 ? 'base64' : undefined;

    it(`should return buffer from data uri (base64 = ${isBase64})`, function () {
      const buffer = Buffer.from('123');

      const dataURI = `data:application/octet-stream${base64Suffix},${buffer.toString(toStringEncoding)}`;

      assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
    });

    it(`should return buffer from data uri without media type (base64 = ${isBase64})`, function () {
      const buffer = Buffer.from('123');

      const dataURI = `data:${base64Suffix},${buffer.toString(toStringEncoding)}`;

      assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
    });

    it(`should return buffer from data uri with charset (base64 = ${isBase64})`, function () {
      const buffer = Buffer.from('123');

      const dataURI = `data:text/plain;charset=US-ASCII${base64Suffix},${buffer.toString(toStringEncoding)}`;

      assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
    });

    if (typeof Blob !== 'undefined') {
      it(`should return buffer from data uri as blob (base64 = ${isBase64})`, function () {
        const buffer = Buffer.from('123');

        const dataURI = `data:application/octet-stream${base64Suffix},${buffer.toString(toStringEncoding)}`;

        assert.deepStrictEqual(fromDataURI(dataURI, true), new Blob([buffer], { type: 'application/octet-stream' }));
        assert.deepStrictEqual(fromDataURI(dataURI), new Blob([buffer], { type: 'application/octet-stream' }));
      });
    }
  }

  it('should return buffer from data uri with url encoded values', function () {
    const buffer = Buffer.from('123%20456');

    const dataURI = `data:application/octet-stream,${buffer.toString()}`;

    assert.deepStrictEqual(fromDataURI(dataURI, false), Buffer.from('123 456'));
  });

  it('should throw for unsupported protocol', function () {
    assert.throws(function () {
      fromDataURI('datax:,hi');
    }, { message: 'Unsupported protocol datax' });
  });

  it('should throw for invalid data uri', function () {
    assert.throws(function () {
      fromDataURI('data:hi');
    }, 'Invalid URL');
  });
});
