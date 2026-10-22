import { afterEach, describe, expect, it } from 'vitest';

import http from 'http';
import axios from 'axios';

const startServer = (handler) => {
  return new Promise((resolve) => {
    const server = http.createServer(handler);

    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
};

const stopServer = (server) => {
  if (!server || !server.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

describe('auth compat (dist export only)', () => {
  let server;

  afterEach(async () => {
    await stopServer(server);
    server = undefined;
  });

  const requestWithConfig = async (config) => {
    server = await startServer((req, res) => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(req.headers.authorization || '');
    });

    const { port } = server.address();

    return axios.get(
      `http://127.0.0.1:${port}/`,
      Object.assign(
        {
          proxy: false,
        },
        config || {}
      )
    );
  };

  it('sets Basic Authorization header from auth credentials', async () => {
    const response = await requestWithConfig({
      auth: {
        username: 'janedoe',
        password: 's00pers3cret',
      },
    });

    const expected = `Basic ${Buffer.from('janedoe:s00pers3cret', 'utf8').toString('base64')}`;

    expect(response.data).toBe(expected);
  });

  it('supports auth without password', async () => {
    const response = await requestWithConfig({
      auth: {
        username: 'Aladdin',
      },
    });

    const expected = `Basic ${Buffer.from('Aladdin:', 'utf8').toString('base64')}`;

    expect(response.data).toBe(expected);
  });

  it('overwrites an existing Authorization header when auth is provided', async () => {
    const response = await requestWithConfig({
      headers: {
        Authorization: 'Bearer token-123',
      },
      auth: {
        username: 'foo',
        password: 'bar',
      },
    });

    const expected = `Basic ${Buffer.from('foo:bar', 'utf8').toString('base64')}`;

    expect(response.data).toBe(expected);
  });

  it('uses URL credentials when auth config is not provided (node adapter behavior)', async () => {
    server = await startServer((req, res) => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(req.headers.authorization || '');
    });

    const { port } = server.address();

    const response = await axios.get(`http://urluser:urlpass@127.0.0.1:${port}/`, {
      proxy: false,
    });

    const expected = `Basic ${Buffer.from('urluser:urlpass', 'utf8').toString('base64')}`;

    expect(response.data).toBe(expected);
  });

  it('prefers auth config over URL credentials', async () => {
    server = await startServer((req, res) => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(req.headers.authorization || '');
    });

    const { port } = server.address();

    const response = await axios.get(`http://urluser:urlpass@127.0.0.1:${port}/`, {
      proxy: false,
      auth: {
        username: 'configuser',
        password: 'configpass',
      },
    });

    const expected = `Basic ${Buffer.from('configuser:configpass', 'utf8').toString('base64')}`;

    expect(response.data).toBe(expected);
  });
});
