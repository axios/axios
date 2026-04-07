const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const axios = require('axios');
const { describe, it } = require('mocha');
const { expect } = require('chai');

const createTransport = (config) => {
  const opts = config || {};

  return {
    request(options, onResponse) {
      const req = new EventEmitter();
      req.destroyed = false;
      req.write = () => true;
      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;

      req.setTimeout = (_ms, cb) => {
        if (opts.timeout) {
          req._timeoutCallback = cb;
        }
      };

      req.end = () => {
        if (opts.error) {
          req.emit('error', opts.error);
          return;
        }

        if (opts.timeout && req._timeoutCallback) {
          req._timeoutCallback();
          return;
        }

        const res = new PassThrough();
        res.statusCode =
          opts.response && opts.response.statusCode !== undefined ? opts.response.statusCode : 200;
        res.statusMessage =
          opts.response && opts.response.statusMessage ? opts.response.statusMessage : 'OK';
        res.headers =
          opts.response && opts.response.headers
            ? opts.response.headers
            : { 'content-type': 'application/json' };
        res.req = req;

        onResponse(res);
        res.end(opts.response && opts.response.body ? opts.response.body : '{"ok":true}');
      };

      return req;
    },
  };
};

describe('error compat (dist export only)', () => {
  it('rejects with AxiosError for non-2xx responses by default', async () => {
    const err = await axios
      .get('http://example.com/fail', {
        proxy: false,
        transport: createTransport({
          response: {
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            body: '{"error":"boom"}',
          },
        }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).to.be.true;
    expect(err.response.status).to.equal(500);
    expect(err.message).to.include('500');
  });

  it('resolves when validateStatus allows non-2xx responses', async () => {
    const response = await axios.get('http://example.com/allowed', {
      proxy: false,
      validateStatus: () => true,
      transport: createTransport({
        response: {
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          body: '{"ok":false}',
        },
      }),
    });

    expect(response.status).to.equal(500);
    expect(response.data).to.deep.equal({ ok: false });
  });

  it('wraps transport errors as AxiosError', async () => {
    const err = await axios
      .get('http://example.com/network', {
        proxy: false,
        transport: createTransport({
          error: new Error('socket hang up'),
        }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).to.be.true;
    expect(err.message).to.include('socket hang up');
    expect(err.toJSON).to.be.a('function');
  });

  it('rejects with ECONNABORTED on timeout', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: 10,
        transport: createTransport({ timeout: true }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).to.be.true;
    expect(err.code).to.equal('ECONNABORTED');
    expect(err.message).to.equal('timeout of 10ms exceeded');
  });

  it('uses timeoutErrorMessage when provided', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: 25,
        timeoutErrorMessage: 'custom timeout message',
        transport: createTransport({ timeout: true }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).to.be.true;
    expect(err.code).to.equal('ECONNABORTED');
    expect(err.message).to.equal('custom timeout message');
  });
});
