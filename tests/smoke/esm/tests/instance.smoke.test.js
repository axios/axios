import { describe, expect, it } from 'vitest';

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';

const createTransportCapture = (responseBody) => {
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
        res.end(responseBody ? responseBody : '{"ok":true}');
      };

      return req;
    },
  };

  return {
    transport,
    getCalls: () => calls,
  };
};

describe('instance compat (dist export only)', () => {
  it('creates isolated instances with separate defaults', async () => {
    const { transport, getCalls } = createTransportCapture();

    const clientA = axios.create({
      baseURL: 'http://example.com/api-a',
      headers: {
        'X-App': 'A',
      },
    });
    const clientB = axios.create({
      baseURL: 'http://example.com/api-b',
      headers: {
        'X-App': 'B',
      },
    });

    await clientA.get('/users', { transport, proxy: false });
    await clientB.get('/users', { transport, proxy: false });

    const [callA, callB] = getCalls();
    expect(callA.path).toBe('/api-a/users');
    expect(callB.path).toBe('/api-b/users');
    expect(callA.headers['X-App']).toBe('A');
    expect(callB.headers['X-App']).toBe('B');
  });

  it('supports callable instance form instance(config)', async () => {
    const { transport, getCalls } = createTransportCapture();
    const client = axios.create({
      baseURL: 'http://example.com',
    });

    await client({
      url: '/status',
      method: 'get',
      transport,
      proxy: false,
    });

    expect(getCalls()).toHaveLength(1);
    expect(getCalls()[0].method).toBe('GET');
    expect(getCalls()[0].path).toBe('/status');
  });

  it('applies instance request interceptors', async () => {
    const { transport, getCalls } = createTransportCapture();
    const client = axios.create({
      baseURL: 'http://example.com',
    });

    client.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers['X-From-Interceptor'] = 'yes';
      return config;
    });

    await client.get('/intercepted', { transport, proxy: false });

    expect(getCalls()).toHaveLength(1);
    expect(getCalls()[0].headers['X-From-Interceptor']).toBe('yes');
  });

  it('applies instance response interceptors', async () => {
    const { transport } = createTransportCapture('{"name":"axios"}');
    const client = axios.create({
      baseURL: 'http://example.com',
    });

    client.interceptors.response.use((response) => {
      response.data = Object.assign({}, response.data, {
        intercepted: true,
      });
      return response;
    });

    const response = await client.get('/response-interceptor', {
      transport,
      proxy: false,
    });

    expect(response.data).toEqual({
      name: 'axios',
      intercepted: true,
    });
  });

  it('builds URLs with getUri from instance defaults and request params', () => {
    const client = axios.create({
      baseURL: 'http://example.com/api',
      params: {
        apiKey: 'abc',
      },
    });

    const uri = client.getUri({
      url: '/users',
      params: {
        page: 2,
      },
    });

    expect(uri).toBe('http://example.com/api/users?apiKey=abc&page=2');
  });
});
