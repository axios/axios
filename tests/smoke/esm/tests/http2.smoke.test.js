import { describe, expect, it } from 'vitest';

import axios from 'axios';

describe('http2 compat (dist export only)', () => {
  it('keeps instance-level httpVersion and http2Options in request config', async () => {
    const client = axios.create({
      baseURL: 'https://example.com',
      httpVersion: 2,
      http2Options: {
        rejectUnauthorized: false,
      },
    });

    const response = await client.get('/resource', {
      adapter: async (config) => ({
        data: {
          httpVersion: config.httpVersion,
          http2Options: config.http2Options,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data.httpVersion).toBe(2);
    expect(response.data.http2Options).toEqual({
      rejectUnauthorized: false,
    });
  });

  it('merges request http2Options with instance http2Options', async () => {
    const client = axios.create({
      baseURL: 'https://example.com',
      httpVersion: 2,
      http2Options: {
        rejectUnauthorized: false,
        sessionTimeout: 1000,
      },
    });

    const response = await client.get('/resource', {
      http2Options: {
        sessionTimeout: 5000,
        customFlag: true,
      },
      adapter: async (config) => ({
        data: config.http2Options,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data).toEqual({
      rejectUnauthorized: false,
      sessionTimeout: 5000,
      customFlag: true,
    });
  });

  it('allows request-level httpVersion override', async () => {
    const client = axios.create({
      baseURL: 'https://example.com',
      httpVersion: 2,
    });

    const response = await client.get('/resource', {
      httpVersion: 1,
      adapter: async (config) => ({
        data: {
          httpVersion: config.httpVersion,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data.httpVersion).toBe(1);
  });
});
