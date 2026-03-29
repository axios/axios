import { describe, it, expect } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

describe('QUERY HTTP method', () => {
  it('should have query and queryForm on Axios prototype', () => {
    const instance = axios.create();
    expect(typeof instance.query).toBe('function');
    expect(typeof instance.queryForm).toBe('function');
  });

  it('should send a QUERY request with a body', async () => {
    const server = await startHTTPServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      res.end(JSON.stringify({
        method: req.method,
        body: body || null,
      }));
    });

    try {
      const { data } = await axios.query(`http://localhost:${server.address().port}/`, {
        filter: 'active',
      });

      assert.strictEqual(data.method, 'QUERY');
      assert.ok(data.body, 'QUERY request should include a body');
      const parsed = JSON.parse(data.body);
      assert.strictEqual(parsed.filter, 'active');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should set default content-type for query method', async () => {
    const server = await startHTTPServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        contentType: req.headers['content-type'],
      }));
    });

    try {
      const { data } = await axios.query(`http://localhost:${server.address().port}/`, {
        key: 'value',
      });

      // Should have application/json content type (from default transformRequest)
      assert.ok(
        data.contentType.includes('application/json'),
        `Expected application/json but got ${data.contentType}`
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support queryForm for multipart/form-data', async () => {
    const server = await startHTTPServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        method: req.method,
        contentType: req.headers['content-type'],
      }));
    });

    try {
      const { data } = await axios.queryForm(`http://localhost:${server.address().port}/`, {
        field: 'value',
      });

      assert.strictEqual(data.method, 'QUERY');
      assert.ok(
        data.contentType.includes('multipart/form-data'),
        `Expected multipart/form-data but got ${data.contentType}`
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should work with axios({ method: "query" }) syntax', async () => {
    const server = await startHTTPServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ method: req.method }));
    });

    try {
      const { data } = await axios({
        method: 'query',
        url: `http://localhost:${server.address().port}/`,
        data: { search: 'test' },
      });

      assert.strictEqual(data.method, 'QUERY');
    } finally {
      await stopHTTPServer(server);
    }
  });
});
