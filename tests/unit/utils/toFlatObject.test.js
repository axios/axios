import { describe, it, expect } from 'vitest';
import utils from '../../../lib/utils.js';

const { toFlatObject } = utils;

describe('utils::toFlatObject', () => {
  it('should resolve object proto chain to a flat object representation', () => {
    const a = { x: 1 };
    const b = Object.create(a, { y: { value: 2 } });
    const c = Object.create(b, { z: { value: 3 } });
    expect(toFlatObject(c)).toEqual({ x: 1, y: 2, z: 3 });
  });
});
