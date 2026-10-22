import { describe, expect, it } from 'vitest';

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';

const normalizeHeaders = (headers) => {
  const result = {};

  Object.entries(headers || {}).forEach(([key, value]) => {
    result[key.toLowerCase()] = value;
  });

  return result;
};

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

describe('headers compat (dist export only)', () => {
  it('sends default Accept header', async () => {
    const { transport, getCapturedOptions } = createTransportCapture();

    await axios.get('http://example.com/default-headers', {
      transport,
      proxy: false,
    });

    const headers = normalizeHeaders(getCapturedOptions().headers);
    expect(headers.accept).toBe('application/json, text/plain, */*');
  });

  it('supports custom headers', async () => {
    const { transport, getCapturedOptions } = createTransportCapture();

    await axios.get('http://example.com/custom-headers', {
      transport,
      proxy: false,
      headers: {
        'X-Trace-Id': 'trace-123',
        Authorization: 'Bearer token-abc',
      },
    });

    const headers = normalizeHeaders(getCapturedOptions().headers);
    expect(headers['x-trace-id']).toBe('trace-123');
    expect(headers.authorization).toBe('Bearer token-abc');
  });

  it('treats header names as case-insensitive when overriding', async () => {
    const { transport, getCapturedOptions } = createTransportCapture();

    await axios.get('http://example.com/case-insensitive', {
      transport,
      proxy: false,
      headers: {
        authorization: 'Bearer old-token',
        AuThOrIzAtIoN: 'Bearer new-token',
      },
    });

    const headers = normalizeHeaders(getCapturedOptions().headers);
    expect(headers.authorization).toBe('Bearer new-token');
  });

  it('sets content-type for json post payloads', async () => {
    const { transport, getCapturedOptions } = createTransportCapture();

    await axios.post(
      'http://example.com/post-json',
      { name: 'widget' },
      {
        transport,
        proxy: false,
      }
    );

    const headers = normalizeHeaders(getCapturedOptions().headers);
    expect(headers['content-type']).toContain('application/json');
  });

  it('does not force content-type for get requests without body', async () => {
    const { transport, getCapturedOptions } = createTransportCapture();

    await axios.get('http://example.com/get-no-body', {
      transport,
      proxy: false,
    });

    const headers = normalizeHeaders(getCapturedOptions().headers);
    expect(headers['content-type']).toBeUndefined();
  });
});
