var httpVerbEvaluator = require('../../../lib/helpers/httpVerbEvaluator');

describe('helpers::httpVerbEvaluator', function () {
  it('returns default array if no http verb config is present and no http body is necessary', function () {
    var result = httpVerbEvaluator(undefined, false);
    expect(result).toEqual(['delete', 'get', 'head']);
  });

  it('returns default array if no http verb config is present, but http body is necessary', function () {
    var result = httpVerbEvaluator(undefined, true);
    expect(result).toEqual(['post', 'put', 'patch']);
  });

  it('returns all items with http body', function () {
    var config = [
      {
        name: 'LINK',
        with_body: true
      }
    ];

    var result = httpVerbEvaluator(config, true);
    expect(result.indexOf('LINK')).not.toBe(-1);
  });

  it('returns all items without http body', function () {
    var config = [
      {
        name: 'LOCK',
        with_body: false
      },
      {
        name: 'LINK',
        with_body: true
      },
      {
        name: 'UNLOCK'
      }
    ];

    var result = httpVerbEvaluator(config, false);
    expect(result.indexOf('LOCK')).not.toBe(-1);
    expect(result.indexOf('LINK')).toBe(-1);
    expect(result.indexOf('UNLOCK')).not.toBe(-1);
  });

  it('throws error unless a name is provided', function () {
    var config = [{}];

    expect(function () {
      httpVerbEvaluator(config, false);
    }).toThrow(new Error('Every http method config object must contain a "name" parameter!'));
  });
});
