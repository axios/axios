import { describe, expect, it } from 'vitest';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('package metadata', () => {
  it('declares the Node.js 20 runtime baseline', () => {
    const { engines } = require('axios/package.json');

    expect(engines).toEqual({ node: '>=20.0.0' });
  });
});
