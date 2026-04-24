const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const axios = require('axios');
const { describe, it } = require('mocha');
const { expect } = require('chai');

const createEchoTransport = () => {
  let capturedOptions;

  const transport = {
    request(options, onResponse) {
      capturedOptions = options;
      const chunks = [];

      const req = new EventEmitter();
      req.destroyed = false;
      req.setTimeout = () => {};
      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;
      req.write = (chunk) => {
        chunks.push(Buffer.from(chunk));
        return true;
      };
      req.end = (chunk) => {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }

        const res = new PassThrough();
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.headers = { 'content-type': 'application/json' };
        res.req = req;
        onResponse(res);
        res.end(
          JSON.stringify({
            path: options.path,
            body: Buffer.concat(chunks).toString('utf8'),
            contentType:
              options.headers &&
              (options.headers['Content-Type'] || options.headers['content-type']),
          })
        );
      };

      return req;
    },
  };

  return {
    transport,
    getCapturedOptions: () => capturedOptions,
  };
};

describe('urlencode compat (dist export only)', () => {
  it('serializes params into request URL', async () => {
    const { transport } = createEchoTransport();

    const response = await axios.get('http://example.com/search', {
      proxy: false,
      transport,
      params: {
        q: 'axios docs',
        page: 2,
      },
    });

    expect(response.data.path).to.equal('/search?q=axios+docs&page=2');
  });

  it('supports custom paramsSerializer function', async () => {
    const { transport } = createEchoTransport();

    const response = await axios.get('http://example.com/search', {
      proxy: false,
      transport,
      params: { q: 'ignored' },
      paramsSerializer: () => 'fixed=1',
    });

    expect(response.data.path).to.equal('/search?fixed=1');
  });

  it('supports URLSearchParams payloads', async () => {
    const { transport } = createEchoTransport();
    const payload = new URLSearchParams();
    payload.append('name', 'axios');
    payload.append('mode', 'compat');

    const response = await axios.post('http://example.com/form', payload, {
      proxy: false,
      transport,
    });

    expect(response.data.body).to.equal('name=axios&mode=compat');
    expect(response.data.contentType).to.contain('application/x-www-form-urlencoded');
  });

  it('serializes object payload when content-type is application/x-www-form-urlencoded', async () => {
    const { transport } = createEchoTransport();

    const response = await axios.post(
      'http://example.com/form',
      {
        name: 'axios',
        mode: 'compat',
      },
      {
        proxy: false,
        transport,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      }
    );

    expect(response.data.body).to.equal('name=axios&mode=compat');
    expect(response.data.contentType).to.contain('application/x-www-form-urlencoded');
  });

  it('respects formSerializer options for index formatting', async () => {
    const { transport } = createEchoTransport();

    const response = await axios.post(
      'http://example.com/form',
      {
        arr: ['1', '2'],
      },
      {
        proxy: false,
        transport,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        formSerializer: {
          indexes: true,
        },
      }
    );

    expect(response.data.body).to.equal('arr%5B0%5D=1&arr%5B1%5D=2');
  });
});
