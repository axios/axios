import { describe, expect, it } from 'vitest';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';

function createTransport({ response, error, timeout }) {
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
        if (timeout) {
          req._timeoutCallback = cb;
        }
      };

      req.end = () => {
        if (error) {
          req.emit('error', error);
          return;
        }

        if (timeout && req._timeoutCallback) {
          req._timeoutCallback();
          return;
        }

        const res = new PassThrough();
        res.statusCode = response?.statusCode ?? 200;
        res.statusMessage = response?.statusMessage ?? 'OK';
        res.headers = response?.headers ?? { 'content-type': 'application/json' };
        res.req = req;

        onResponse(res);
        res.end(response?.body ?? '{"ok":true}');
      };

      return req;
    },
  };
}

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

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.response.status).toBe(500);
    expect(err.message).toContain('500');
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

    expect(response.status).toBe(500);
    expect(response.data).toEqual({ ok: false });
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

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.message).toContain('socket hang up');
    expect(err.toJSON).toBeTypeOf('function');
  });

  it('rejects with ECONNABORTED on timeout', async () => {
    const err = await axios
      .get('http://example.com/timeout', {
        proxy: false,
        timeout: 10,
        transport: createTransport({ timeout: true }),
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ECONNABORTED');
    expect(err.message).toBe('timeout of 10ms exceeded');
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

    expect(axios.isAxiosError(err)).toBe(true);
    expect(err.code).toBe('ECONNABORTED');
    expect(err.message).toBe('custom timeout message');
  });
});
