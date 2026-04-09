import { describe, expect, test } from 'bun:test';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import axios from 'axios';

type TransportCall = {
  options: Record<string, any>;
  body: Buffer;
};

const createTransportMock = (
  responseFactory?: (body: Buffer, options: Record<string, any>) => Record<string, any>
) => {
  const calls: TransportCall[] = [];

  const transport = {
    request(options: Record<string, any>, onResponse: (res: PassThrough) => void) {
      const req = new EventEmitter() as Record<string, any>;
      const chunks: Buffer[] = [];

      req.destroyed = false;
      req.setTimeout = () => {};
      req.write = (chunk?: unknown) => {
        if (chunk !== undefined) {
          chunks.push(Buffer.from(chunk as string));
        }
        return true;
      };
      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;
      req.end = (chunk?: unknown) => {
        if (chunk !== undefined) {
          chunks.push(Buffer.from(chunk as string));
        }

        const body = Buffer.concat(chunks);
        calls.push({ options, body });

        const response = responseFactory ? responseFactory(body, options) : {};
        const res = new PassThrough() as PassThrough & Record<string, any>;
        res.statusCode = response.statusCode ?? 200;
        res.statusMessage = response.statusMessage ?? 'OK';
        res.headers = response.headers ?? { 'content-type': 'application/json' };
        res.req = req;

        onResponse(res);
        res.end(response.body ?? JSON.stringify({ ok: true }));
      };

      return req;
    },
  };

  return {
    transport,
    getCalls: () => calls,
  };
};

describe('http adapter', () => {
  test('GET via http adapter returns mocked response data', async () => {
    const { transport, getCalls } = createTransportMock();

    const response = await axios.get('http://example.com/users', {
      adapter: 'http',
      proxy: false,
      transport,
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(getCalls()).toHaveLength(1);
  });

  test('POST sends JSON-serialized body via http adapter', async () => {
    const { transport, getCalls } = createTransportMock();

    await axios.post(
      'http://example.com/items',
      { name: 'widget' },
      {
        adapter: 'http',
        proxy: false,
        transport,
      }
    );

    const { body } = getCalls()[0];
    expect(body.toString('utf8')).toBe(JSON.stringify({ name: 'widget' }));
  });

  test('default adapter selection in Bun routes through http adapter', async () => {
    const { transport, getCalls } = createTransportMock();

    await axios.get('http://example.com/default-adapter', {
      proxy: false,
      transport,
    });

    expect(getCalls()).toHaveLength(1);
  });
});
