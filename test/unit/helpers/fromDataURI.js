var assert = require('assert');
var fromDataURI = require('../../../lib/helpers/fromDataURI');

describe('helpers::fromDataURI', function () {
  it('should return buffer from data uri', function () {
    const buffer= Buffer.from('123');

    const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });
});
