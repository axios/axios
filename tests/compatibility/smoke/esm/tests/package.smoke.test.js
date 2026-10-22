import { describe, expect, it } from 'vitest';

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('package metadata', () => {
  it('loads the published package rather than the workspace source', () => {
    const path = realpathSync(require.resolve('axios/package.json'));
    expect(path).toMatch(/[\\/]node_modules[\\/]axios[\\/]package\.json$/);
    expect(require('axios/package.json').repository.directory).toBe('packages/axios');
  });

  it('declares the Node.js 20 runtime baseline', () => {
    const { engines } = require('axios/package.json');

    expect(engines).toEqual({ node: '>=20.0.0' });
  });
});
