import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

describe('utils::trim', () => {
  it('should trim spaces', () => {
    expect(utils.trim('  foo  ')).toEqual('foo');
  });

  it('should trim tabs', () => {
    expect(utils.trim('\tfoo\t')).toEqual('foo');
  });
});
