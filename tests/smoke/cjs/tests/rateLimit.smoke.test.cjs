const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const axios = require('axios');
const { describe, it } = require('mocha');
const { expect } = require('chai');

const createTransportCapture = () => {
  let capturedOptions;

  const transport = {
    request(options, onResponse) {
      capturedOptions = options;

      const req = new EventEmitter();
      req.destroyed = false;
      req.setTimeout = () => {};
      req.write = () => true;
      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;
      req.end = () => {
        const res = new PassThrough();
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.headers = { 'content-type': 'application/json' };
        res.req = req;
        onResponse(res);
        res.end('{"ok":true}');
      };

      return req;
    },
  };

  return {
    transport,
    getCapturedOptions: () => capturedOptions,
  };
};

describe('rateLimit compat (dist export only)', () => {
  it('accepts numeric maxRate config', async () => {
    const response = await axios.get('http://example.com/rate', {
      maxRate: 1024,
      adapter: async (config) => ({
        data: { maxRate: config.maxRate },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data.maxRate).to.equal(1024);
  });

  it('accepts tuple maxRate config [upload, download]', async () => {
    const response = await axios.get('http://example.com/rate', {
      maxRate: [2048, 4096],
      adapter: async (config) => ({
        data: { maxRate: config.maxRate },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data.maxRate).to.deep.equal([2048, 4096]);
  });

  it('merges instance and request maxRate values', async () => {
    const client = axios.create({
      maxRate: [1000, 2000],
    });

    const response = await client.get('http://example.com/rate', {
      maxRate: [3000, 4000],
      adapter: async (config) => ({
        data: { maxRate: config.maxRate },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data.maxRate).to.deep.equal([3000, 4000]);
  });

  it('supports maxRate in node transport flow without errors', async () => {
    const { transport, getCapturedOptions } = createTransportCapture();

    const response = await axios.get('http://example.com/rate', {
      proxy: false,
      maxRate: [1500, 2500],
      transport,
    });

    expect(response.status).to.equal(200);
    expect(getCapturedOptions().method).to.equal('GET');
    expect(getCapturedOptions().path).to.equal('/rate');
  });
});
