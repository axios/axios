import utils from '../../../lib/utils';

describe('utils::trim', function () {
  it('should trim spaces', function () {
    expect(utils.trim('  foo  ')).toEqual('foo');
  });

  it('should trim tabs', function () {
    expect(utils.trim('\tfoo\t')).toEqual('foo');
  });
});

