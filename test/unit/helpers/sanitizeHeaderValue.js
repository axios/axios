var assert = require('assert');
var sanitizeHeaderValue = require('../../../lib/helpers/sanitizeHeaderValue');

describe('helpers::sanitizeHeaderValue', function () {
  it('should remove invalid header characters', function () {
    assert.strictEqual(sanitizeHeaderValue('ok\r\nInjected: yes'), 'okInjected: yes');
    assert.strictEqual(sanitizeHeaderValue('ok\x01bad'), 'okbad');
  });

  it('should remove boundary whitespace', function () {
    assert.strictEqual(sanitizeHeaderValue(' value\t'), 'value');
  });

  it('should sanitize array values recursively', function () {
    assert.deepStrictEqual(
      sanitizeHeaderValue([' safe=1 ', 'unsafe=1\nInjected: true']),
      ['safe=1', 'unsafe=1Injected: true']
    );
  });
});
