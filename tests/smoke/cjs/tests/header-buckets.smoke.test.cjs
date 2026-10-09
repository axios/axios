const axios = require('axios');
const otherAxios = require('axios/dist/browser/axios.cjs');
const { describe, it } = require('mocha');
const { expect } = require('chai');

describe('header buckets across package exports', () => {
  it('should preserve AxiosHeaders buckets from a different build', async () => {
    const { echoHeaders } = await import('../../../setup/adapters.js');
    expect(axios.AxiosHeaders).not.to.equal(otherAxios.AxiosHeaders);
    const instance = axios.create({
      adapter: echoHeaders,
      headers: {
        common: new otherAxios.AxiosHeaders({ 'X-Common': 'common' }),
        post: new otherAxios.AxiosHeaders({ Authorization: 'Bearer TEST_ONLY' }),
      },
    });

    for (const method of ['get', 'post']) {
      const { config } = await instance.request({
        url: '/header-buckets',
        method,
        headers: { Link: Buffer.from('<https://example.com/resource>; rel="type"') },
      });

      expect(config.headers.get('X-Common')).to.equal('common');
      expect(config.headers.get('Authorization')).to.equal(
        method === 'post' ? 'Bearer TEST_ONLY' : undefined
      );
      expect(config.headers.get('Link')).to.equal('<https://example.com/resource>; rel="type"');
      expect(config.headers.has('common')).to.equal(false);
      expect(config.headers.has('post')).to.equal(false);
    }
  });
});
