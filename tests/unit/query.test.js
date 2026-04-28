import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';
import { startHTTPServer, stopHTTPServer } from '../setup/server.js';

describe('QUERY method', () => {
  describe('static axios.query()', () => {
    it('should make a request with the QUERY HTTP method', async () => {
      const response = await axios.query('/test', null, {
        adapter: (config) => {
          assert.strictEqual(config.method, 'query');
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });

      assert.strictEqual(response.status, 200);
    });

    it('should support a request body', async () => {
      const requestBody = { selector: 'field1, field2', filter: { active: true } };

      await axios.query('/search', requestBody, {
        adapter: (config) => {
          assert.deepStrictEqual(config.data, JSON.stringify(requestBody));
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });
    });

    it('should support custom headers', async () => {
      await axios.query('/test', null, {
        headers: {
          'X-Custom-Header': 'custom-value',
          Authorization: 'Bearer token-abc',
        },
        adapter: (config) => {
          assert.strictEqual(config.headers.get('X-Custom-Header'), 'custom-value');
          assert.strictEqual(config.headers.get('Authorization'), 'Bearer token-abc');
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });
    });

    it('should work with baseURL configuration', async () => {
      const instance = axios.create({ baseURL: 'http://example.com/api' });

      await instance.query('/resources', { fields: ['name'] }, {
        adapter: (config) => {
          assert.strictEqual(config.baseURL, 'http://example.com/api');
          assert.strictEqual(config.url, '/resources');
          assert.strictEqual(config.method, 'query');
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });
    });

    it('should set Content-Type to application/json for object bodies', async () => {
      await axios.query('/test', { key: 'value' }, {
        adapter: (config) => {
          assert.ok(
            config.headers.get('Content-Type').includes('application/json'),
            'Expected Content-Type to include application/json'
          );
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });
    });
  });

  describe('instance.query()', () => {
    it('should make a request with the QUERY HTTP method on an instance', async () => {
      const instance = axios.create();

      const response = await instance.query('/test', null, {
        adapter: (config) => {
          assert.strictEqual(config.method, 'query');
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });

      assert.strictEqual(response.status, 200);
    });

    it('should merge instance defaults with request config', async () => {
      const instance = axios.create({
        headers: { 'X-Instance-Header': 'from-instance' },
      });

      await instance.query('/test', null, {
        headers: { 'X-Request-Header': 'from-request' },
        adapter: (config) => {
          assert.strictEqual(config.headers.get('X-Instance-Header'), 'from-instance');
          assert.strictEqual(config.headers.get('X-Request-Header'), 'from-request');
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });
    });
  });

  describe('axios({ method: "query" })', () => {
    it('should support the generic request form', async () => {
      const response = await axios({
        method: 'query',
        url: '/test',
        data: { selector: '*' },
        adapter: (config) => {
          assert.strictEqual(config.method, 'query');
          assert.deepStrictEqual(config.data, JSON.stringify({ selector: '*' }));
          return Promise.resolve({
            data: { result: 'ok' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          });
        },
      });

      assert.deepStrictEqual(response.data, { result: 'ok' });
    });
  });

  describe('with HTTP server', () => {
    it('should send QUERY requests with a body to a real server', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              method: req.method,
              url: req.url,
              body,
              headers: req.headers,
            }));
          });
        },
        { port: 0 }
      );

      try {
        const { data } = await axios.query(
          `http://localhost:${server.address().port}/search`,
          { selector: 'field1' }
        );

        assert.strictEqual(data.method, 'QUERY');
        assert.strictEqual(data.url, '/search');

        const parsedBody = JSON.parse(data.body);
        assert.deepStrictEqual(parsedBody, { selector: 'field1' });
        assert.ok(
          data.headers['content-type'].includes('application/json'),
          'Expected server to receive application/json content-type'
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should send QUERY requests with custom headers to a real server', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            method: req.method,
            headers: req.headers,
          }));
        },
        { port: 0 }
      );

      try {
        const { data } = await axios.query(
          `http://localhost:${server.address().port}/test`,
          null,
          {
            headers: {
              'X-Custom': 'test-value',
            },
          }
        );

        assert.strictEqual(data.method, 'QUERY');
        assert.strictEqual(data.headers['x-custom'], 'test-value');
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should send QUERY requests with baseURL to a real server', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            method: req.method,
            url: req.url,
          }));
        },
        { port: 0 }
      );

      try {
        const instance = axios.create({
          baseURL: `http://localhost:${server.address().port}/api`,
        });

        const { data } = await instance.query('/resources', { fields: ['name'] });

        assert.strictEqual(data.method, 'QUERY');
        assert.strictEqual(data.url, '/api/resources');
      } finally {
        await stopHTTPServer(server);
      }
    });
  });
});
