import { describe, expect, it } from 'vitest';

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';

const createTransport = (responseBody) => {
  const calls = [];

  const transport = {
    request(options, onResponse) {
      calls.push(options);

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
        res.end(responseBody ? responseBody : '{"value":"ok"}');
      };

      return req;
    },
  };

  return {
    transport,
    getCalls: () => calls,
  };
};

describe('interceptors compat (dist export only)', () => {
  it('applies request interceptors before dispatch', async () => {
    const { transport, getCalls } = createTransport();
    const client = axios.create();

    client.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers['X-One'] = '1';
      return config;
    });

    client.interceptors.request.use((config) => {
      config.headers['X-Two'] = '2';
      return config;
    });

    await client.get('http://example.com/resource', {
      transport,
      proxy: false,
    });

    expect(getCalls()).toHaveLength(1);
    expect(getCalls()[0].headers['X-One']).toBe('1');
    expect(getCalls()[0].headers['X-Two']).toBe('2');
  });

  it('applies response interceptors in registration order', async () => {
    const { transport } = createTransport('{"n":1}');
    const client = axios.create();

    client.interceptors.response.use((response) => {
      response.data.n += 1;
      return response;
    });

    client.interceptors.response.use((response) => {
      response.data.n *= 10;
      return response;
    });

    const response = await client.get('http://example.com/resource', {
      transport,
      proxy: false,
    });

    expect(response.data.n).toBe(20);
  });

  it('supports ejecting request interceptors', async () => {
    const { transport, getCalls } = createTransport();
    const client = axios.create();

    const id = client.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers['X-Ejected'] = 'yes';
      return config;
    });

    client.interceptors.request.eject(id);

    await client.get('http://example.com/resource', {
      transport,
      proxy: false,
    });

    expect(getCalls()).toHaveLength(1);
    expect(getCalls()[0].headers['X-Ejected']).toBeUndefined();
  });

  it('supports async request interceptors', async () => {
    const { transport, getCalls } = createTransport();
    const client = axios.create();

    client.interceptors.request.use(async (config) => {
      await Promise.resolve();
      config.headers = config.headers || {};
      config.headers['X-Async'] = 'true';
      return config;
    });

    await client.get('http://example.com/resource', {
      transport,
      proxy: false,
    });

    expect(getCalls()[0].headers['X-Async']).toBe('true');
  });

  it('propagates errors thrown by request interceptors', async () => {
    const { transport, getCalls } = createTransport();
    const client = axios.create();

    client.interceptors.request.use(() => {
      throw new Error('blocked-by-interceptor');
    });

    const err = await client
      .get('http://example.com/resource', {
        transport,
        proxy: false,
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('blocked-by-interceptor');
    expect(getCalls()).toHaveLength(0);
  });
});
