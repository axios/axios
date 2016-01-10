var registerHttpMethods = require('../../../lib/helpers/registerHttpMethods');

describe('helper::registerHttpMethods', function () {
  it('registers callbacks', function () {
    var pseudoInstance = {};
    registerHttpMethods(['link', 'unlink'], false, pseudoInstance, null, null);

    expect(typeof pseudoInstance.link).toBe('function');
    expect(typeof pseudoInstance.unlink).toBe('function');
  });
});
