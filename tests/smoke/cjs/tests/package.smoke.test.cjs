const { expect } = require('chai');
const { describe, it } = require('mocha');

describe('package metadata', () => {
  it('declares the Node.js 20 runtime baseline', () => {
    const { engines } = require('axios/package.json');

    expect(engines).to.deep.equal({ node: '>=20.0.0' });
  });
});
