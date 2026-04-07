import { describe, expect, it } from 'vitest';

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';

const createTransport = (config) => {
  const opts = config || {};

  return {
    request(_options, onResponse) {
      const req = new EventEmitter();
      req.destroyed = false;
      req._timeoutCallback = null;

      req.setTimeout = (_ms, callback) => {
        req._timeoutCallback = callback;
      };

      req.write = () => true;

      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;

      req.end = () => {
        if (opts.triggerTimeout && req._timeoutCallback) {
          req._timeoutCallback();
          return;
        }

        const res = new PassThrough();
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.headers = { 'content-type': 'application/json' };
        res.req = req;

        onResponse(res);
        res.end(opts.body === undefined ? '{"ok":true}' : opts.body);
      };

      return req;
    },
  };
};

describe('timeout compat (dist export only)', () => {
  it('rejects with ECONNABORTED on timeout', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: 25,
        transport: createTransport({ triggerTimeout: true }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ECONNABORTED');
    expect(err.message).toBe('timeout of 25ms exceeded');
  });

  it('uses timeoutErrorMessage when provided', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: 25,
        timeoutErrorMessage: 'custom timeout',
        transport: createTransport({ triggerTimeout: true }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ECONNABORTED');
    expect(err.message).toBe('custom timeout');
  });

  it('accepts timeout as a numeric string', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: '30',
        transport: createTransport({ triggerTimeout: true }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ECONNABORTED');
    expect(err.message).toBe('timeout of 30ms exceeded');
  });

  it('rejects with ERR_BAD_OPTION_VALUE when timeout is not parsable', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: { invalid: true },
        transport: createTransport(),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ERR_BAD_OPTION_VALUE');
    expect(err.message).toBe('error trying to parse `config.timeout` to int');
  });

  it('does not time out when timeout is 0', async () => {
    const response = await axios.get('http://example.com/no-timeout', {
      proxy: false,
      timeout: 0,
      transport: createTransport({ body: '{"ok":true}' }),
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
  });
});
