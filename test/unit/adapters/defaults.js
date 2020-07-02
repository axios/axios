var defaults = require('../../../lib/defaults');
var assert = require('assert');


describe('supports httpAdapter with nodejs', function () {

  it('should be HTTP in node', function (done) {
    assert.equal(typeof defaults.adapter,'function')
    assert.equal(defaults.adapter.name,'httpAdapter')
    done();
  });
});


