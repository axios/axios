var defaults = require('../../lib/defaults');

describe('defaults', function () {
  it('should transform request json', function () {
    expect(defaults.transformRequest[0]({foo: 'bar'})).toEqual('{"foo":"bar"}');
  });

  it('should do nothing to request string', function () {
    expect(defaults.transformRequest[0]('foo=bar')).toEqual('foo=bar');
  });

  it('should transform response json', function () {
    var data = defaults.transformResponse[0]('{"foo":"bar"}');

    expect(typeof data).toEqual('object');
    expect(data.foo).toEqual('bar');
  });

  it('should do nothing to response string', function () {
    expect(defaults.transformResponse[0]('foo=bar')).toEqual('foo=bar');
  });
});

