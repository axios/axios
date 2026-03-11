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
      req.end = () => {
        const res = new PassThrough();
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.headers = { 'content-type': 'application/json' };
        res.req = req;
        onResponse(res);
        res.end('{"ok":true}');
      };
      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;

      return req;
    },
  };

  return {
    transport,
    getCapturedOptions: () => capturedOptions,
  };
};

const runRequest = async (run) => {
  const { transport, getCapturedOptions } = createTransportCapture();
  await run(transport);

  return getCapturedOptions();
};

describe('basic compat (dist export only)', () => {
  it('supports the simplest axios(url) request pattern', async () => {
    const options = await runRequest((transport) =>
      axios('http://example.com/users', {
        transport,
        proxy: false,
      })
    );

    expect(options.method).to.equal('GET');
    expect(options.path).to.equal('/users');
  });

  it('supports get()', async () => {
    const options = await runRequest((transport) =>
      axios.get('http://example.com/items?limit=10', { transport, proxy: false })
    );

    expect(options.method).to.equal('GET');
    expect(options.path).to.equal('/items?limit=10');
  });

  it('supports delete()', async () => {
    const options = await runRequest((transport) =>
      axios.delete('http://example.com/items/1', { transport, proxy: false })
    );

    expect(options.method).to.equal('DELETE');
    expect(options.path).to.equal('/items/1');
  });

  it('supports head()', async () => {
    const options = await runRequest((transport) =>
      axios.head('http://example.com/health', { transport, proxy: false })
    );

    expect(options.method).to.equal('HEAD');
    expect(options.path).to.equal('/health');
  });

  it('supports options()', async () => {
    const options = await runRequest((transport) =>
      axios.options('http://example.com/items', { transport, proxy: false })
    );

    expect(options.method).to.equal('OPTIONS');
    expect(options.path).to.equal('/items');
  });

  it('supports post()', async () => {
    const options = await runRequest((transport) =>
      axios.post(
        'http://example.com/items',
        { name: 'widget' },
        {
          transport,
          proxy: false,
        }
      )
    );

    expect(options.method).to.equal('POST');
    expect(options.path).to.equal('/items');
  });

  it('supports put()', async () => {
    const options = await runRequest((transport) =>
      axios.put(
        'http://example.com/items/1',
        { name: 'updated-widget' },
        {
          transport,
          proxy: false,
        }
      )
    );

    expect(options.method).to.equal('PUT');
    expect(options.path).to.equal('/items/1');
  });

  it('supports patch()', async () => {
    const options = await runRequest((transport) =>
      axios.patch(
        'http://example.com/items/1',
        { status: 'active' },
        {
          transport,
          proxy: false,
        }
      )
    );

    expect(options.method).to.equal('PATCH');
    expect(options.path).to.equal('/items/1');
  });
});
