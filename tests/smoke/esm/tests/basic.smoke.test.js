import { describe, expect, it } from 'vitest';

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';

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

    expect(options.method).toBe('GET');
    expect(options.path).toBe('/users');
  });

  it('supports get()', async () => {
    const options = await runRequest((transport) =>
      axios.get('http://example.com/items?limit=10', { transport, proxy: false })
    );

    expect(options.method).toBe('GET');
    expect(options.path).toBe('/items?limit=10');
  });

  it('supports delete()', async () => {
    const options = await runRequest((transport) =>
      axios.delete('http://example.com/items/1', { transport, proxy: false })
    );

    expect(options.method).toBe('DELETE');
    expect(options.path).toBe('/items/1');
  });

  it('supports head()', async () => {
    const options = await runRequest((transport) =>
      axios.head('http://example.com/health', { transport, proxy: false })
    );

    expect(options.method).toBe('HEAD');
    expect(options.path).toBe('/health');
  });

  it('supports options()', async () => {
    const options = await runRequest((transport) =>
      axios.options('http://example.com/items', { transport, proxy: false })
    );

    expect(options.method).toBe('OPTIONS');
    expect(options.path).toBe('/items');
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

    expect(options.method).toBe('POST');
    expect(options.path).toBe('/items');
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

    expect(options.method).toBe('PUT');
    expect(options.path).toBe('/items/1');
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

    expect(options.method).toBe('PATCH');
    expect(options.path).toBe('/items/1');
  });
});
