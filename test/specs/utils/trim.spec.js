var trim = require('../../../lib/utils').trim;

describe('utils::trim', () => {
  it('should trim spaces', () => {
    expect(trim('  foo  ')).toEqual('foo');
  });

  it('should trim tabs', () => {
    expect(trim('\tfoo\t')).toEqual('foo');
  });
});

