const { realpathSync } = require('node:fs');
const { expect } = require('chai');
const { describe, it } = require('mocha');

describe('package metadata', () => {
  it('loads the published package rather than the workspace source', () => {
    const path = realpathSync(require.resolve('axios/package.json'));
    expect(path).to.match(/[\\/]node_modules[\\/]axios[\\/]package\.json$/);
  });

  it('declares the Node.js 20 runtime baseline', () => {
    const { engines } = require('axios/package.json');

    expect(engines).to.deep.equal({ node: '>=20.0.0' });
  });
});
