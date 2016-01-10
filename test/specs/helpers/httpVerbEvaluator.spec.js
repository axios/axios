var httpVerbEvaluator = require('../../../lib/helpers/httpVerbEvaluator');

describe('helpers::httpVerbEvaluator', function () {
  it('returns all items with http body', function () {
    var config = [
      {
        name: 'LINK',
        with_body: true
      }
    ];

    var result = httpVerbEvaluator(config, true);
    expect(result.indexOf('link')).not.toBe(-1);
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
    expect(result.indexOf('lock')).not.toBe(-1);
    expect(result.indexOf('link')).toBe(-1);
    expect(result.indexOf('unlock')).not.toBe(-1);
  });

  it('throws error unless a name is provided', function () {
    var config = [{}];

    expect(function () {
      httpVerbEvaluator(config, false);
    }).toThrow(new Error('Every http method config object must contain a "name" parameter!'));
  });
});
