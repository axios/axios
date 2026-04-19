/* eslint-disable no-prototype-builtins */
import { afterEach, describe, it } from 'vitest';
import assert from 'assert';
import http from 'http';
import utils from '../../lib/utils.js';
import mergeConfig from '../../lib/core/mergeConfig.js';
import defaults from '../../lib/defaults/index.js';
import axios from '../../index.js';

describe('Prototype Pollution Protection', () => {
  afterEach(() => {
    // Clean up any pollution that might have occurred.
    delete Object.prototype.polluted;
    delete Object.prototype.parseReviver;
    delete Object.prototype.transport;
    delete Object.prototype.transformRequest;
    delete Object.prototype.transformResponse;
    delete Object.prototype.formSerializer;
    delete Object.prototype.httpVersion;
    delete Object.prototype.lookup;
    delete Object.prototype.family;
    delete Object.prototype.http2Options;
    delete Object.prototype.validateStatus;
  });

  describe('utils.merge', () => {
    it('should filter __proto__ key at top level', () => {
      const result = utils.merge({}, { __proto__: { polluted: 'yes' }, safe: 'value' });

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.safe, 'value');
      assert.strictEqual(result.hasOwnProperty('__proto__'), false);
    });

    it('should filter constructor key at top level', () => {
      const result = utils.merge({}, { constructor: { polluted: 'yes' }, safe: 'value' });

      assert.strictEqual(result.safe, 'value');
      assert.strictEqual(result.hasOwnProperty('constructor'), false);
    });

    it('should filter prototype key at top level', () => {
      const result = utils.merge({}, { prototype: { polluted: 'yes' }, safe: 'value' });

      assert.strictEqual(result.safe, 'value');
      assert.strictEqual(result.hasOwnProperty('prototype'), false);
    });

    it('should filter __proto__ key in nested objects', () => {
      const result = utils.merge(
        {},
        {
          headers: {
            __proto__: { polluted: 'nested' },
            'Content-Type': 'application/json',
          },
        }
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers['Content-Type'], 'application/json');
      assert.strictEqual(result.headers.hasOwnProperty('__proto__'), false);
    });

    it('should filter constructor key in nested objects', () => {
      const result = utils.merge(
        {},
        {
          headers: {
            constructor: { prototype: { polluted: 'nested' } },
            'Content-Type': 'application/json',
          },
        }
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers['Content-Type'], 'application/json');
      assert.strictEqual(result.headers.hasOwnProperty('constructor'), false);
    });

    it('should filter prototype key in nested objects', () => {
      const result = utils.merge(
        {},
        {
          headers: {
            prototype: { polluted: 'nested' },
            'Content-Type': 'application/json',
          },
        }
      );

      assert.strictEqual(result.headers['Content-Type'], 'application/json');
      assert.strictEqual(result.headers.hasOwnProperty('prototype'), false);
    });

    it('should filter dangerous keys in deeply nested objects', () => {
      const result = utils.merge(
        {},
        {
          level1: {
            level2: {
              __proto__: { polluted: 'deep' },
              prototype: { polluted: 'deep' },
              safe: 'value',
            },
          },
        }
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.level1.level2.safe, 'value');
      assert.strictEqual(result.level1.level2.hasOwnProperty('__proto__'), false);
    });

    it('should still merge regular properties correctly', () => {
      const result = utils.merge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 });

      assert.strictEqual(result.a, 1);
      assert.strictEqual(result.b.c, 2);
      assert.strictEqual(result.b.d, 3);
      assert.strictEqual(result.e, 4);
    });

    it('should handle JSON.parse payloads safely', () => {
      const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}}');
      const result = utils.merge({}, malicious);

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.hasOwnProperty('__proto__'), false);
    });

    it('should handle nested JSON.parse payloads safely', () => {
      const malicious = JSON.parse(
        '{"headers": {"constructor": {"prototype": {"polluted": "yes"}}}}'
      );
      const result = utils.merge({}, malicious);

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers.hasOwnProperty('constructor'), false);
    });
  });

  describe('mergeConfig', () => {
    it('should filter dangerous keys at top level', () => {
      const result = mergeConfig(
        {},
        {
          __proto__: { polluted: 'yes' },
          constructor: { polluted: 'yes' },
          prototype: { polluted: 'yes' },
          url: '/api/test',
        }
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.url, '/api/test');
      assert.strictEqual(result.hasOwnProperty('__proto__'), false);
      assert.strictEqual(result.hasOwnProperty('constructor'), false);
      assert.strictEqual(result.hasOwnProperty('prototype'), false);
    });

    it('should filter dangerous keys in headers', () => {
      const result = mergeConfig(
        {},
        {
          headers: {
            __proto__: { polluted: 'yes' },
            'Content-Type': 'application/json',
          },
        }
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers['Content-Type'], 'application/json');
      assert.strictEqual(result.headers.hasOwnProperty('__proto__'), false);
    });

    it('should filter dangerous keys in custom config properties', () => {
      const result = mergeConfig(
        {},
        {
          customProp: {
            __proto__: { polluted: 'yes' },
            safe: 'value',
          },
        }
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.customProp.safe, 'value');
      assert.strictEqual(result.customProp.hasOwnProperty('__proto__'), false);
    });

    it('should still merge configs correctly', () => {
      const config1 = {
        baseURL: 'https://api.example.com',
        timeout: 1000,
        headers: {
          common: {
            Accept: 'application/json',
          },
        },
      };

      const config2 = {
        url: '/users',
        timeout: 5000,
        headers: {
          common: {
            'Content-Type': 'application/json',
          },
        },
      };

      const result = mergeConfig(config1, config2);

      assert.strictEqual(result.baseURL, 'https://api.example.com');
      assert.strictEqual(result.url, '/users');
      assert.strictEqual(result.timeout, 5000);
      assert.strictEqual(result.headers.common.Accept, 'application/json');
      assert.strictEqual(result.headers.common['Content-Type'], 'application/json');
    });

    // GHSA-pf86-5x62-jrwf gadget 3: polluted transformRequest/Response must not
    // replace the safe defaults through inherited reads during merge.
    it('should not inherit polluted transformRequest from Object.prototype', () => {
      const polluted = () => 'attacker';
      Object.prototype.transformRequest = polluted;

      const result = mergeConfig({ transformRequest: [(d) => d] }, { url: '/x' });

      assert.notStrictEqual(result.transformRequest, polluted);
      assert.ok(Array.isArray(result.transformRequest));
    });

    it('should not inherit polluted transformResponse from Object.prototype', () => {
      const polluted = () => 'attacker';
      Object.prototype.transformResponse = polluted;

      const result = mergeConfig({ transformResponse: [(d) => d] }, { url: '/x' });

      assert.notStrictEqual(result.transformResponse, polluted);
      assert.ok(Array.isArray(result.transformResponse));
    });
  });

  // GHSA-pf86-5x62-jrwf gadget 1: parseReviver read via prototype chain.
  describe('defaults.transformResponse parseReviver', () => {
    it('should ignore Object.prototype.parseReviver when parsing JSON', () => {
      let reviverCalled = false;
      Object.prototype.parseReviver = function polluted(k, v) {
        reviverCalled = true;
        if (k === 'role') return 'admin';
        return v;
      };

      const ctx = { transitional: defaults.transitional };
      const result = defaults.transformResponse[0].call(
        ctx,
        '{"role":"user","balance":100}'
      );

      assert.strictEqual(reviverCalled, false);
      assert.strictEqual(result.role, 'user');
      assert.strictEqual(result.balance, 100);
    });

    it('should ignore Object.prototype.responseType', () => {
      Object.prototype.responseType = 'json';
      const ctx = { transitional: defaults.transitional };
      // Non-JSON string body must be returned as-is; polluted responseType must
      // not force strict JSON parsing.
      const result = defaults.transformResponse[0].call(ctx, 'plain text');
      assert.strictEqual(result, 'plain text');
      delete Object.prototype.responseType;
    });
  });

  // GHSA-w9j2-pvgh-6h63: mergeDirectKeys must not inherit validateStatus from
  // Object.prototype (was using the `in` operator which traverses the chain).
  describe('GHSA-w9j2-pvgh-6h63 validateStatus merge', () => {
    it('should not inherit a polluted validateStatus during mergeConfig', () => {
      Object.prototype.validateStatus = () => true;

      const merged = mergeConfig(defaults, { url: '/x' });

      assert.strictEqual(merged.validateStatus, defaults.validateStatus);
    });

    it('should keep 4xx/5xx responses rejected when Object.prototype.validateStatus is polluted', async () => {
      Object.prototype.validateStatus = () => true;

      const server = http.createServer((req, res) => {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end('{"error":"unauthorized"}');
      });

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address();

      try {
        let threw = false;
        try {
          await axios.get(`http://127.0.0.1:${port}/`);
        } catch (err) {
          threw = true;
          assert.strictEqual(err.response.status, 401);
        }
        assert.strictEqual(threw, true);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }, 10000);
  });

  // GHSA-3w6x-2g7m-8v23: end-to-end check that a polluted parseReviver does not
  // tamper with JSON response bodies through the full axios.get pipeline.
  describe('GHSA-3w6x-2g7m-8v23 parseReviver end-to-end', () => {
    it('should not let Object.prototype.parseReviver tamper with JSON responses', async () => {
      let reviverCalled = false;
      const stolen = {};
      Object.prototype.parseReviver = function polluted(key, value) {
        reviverCalled = true;
        if (key && typeof value !== 'object') stolen[key] = value;
        if (key === 'isAdmin') return true;
        if (key === 'role') return 'admin';
        if (key === 'balance') return 999999;
        return value;
      };

      const payload = {
        user: 'john',
        role: 'viewer',
        isAdmin: false,
        balance: 100,
        apiKey: 'sk-secret-internal-key',
      };

      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      });

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address();

      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);

        assert.strictEqual(reviverCalled, false);
        assert.deepStrictEqual(res.data, payload);
        assert.deepStrictEqual(stolen, {});
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }, 10000);
  });

  // GHSA-pf86-5x62-jrwf gadget 2: http adapter must not read config.transport
  // (or related keys) from Object.prototype.
  describe('http adapter prototype reads', () => {
    it('should not invoke Object.prototype.transport on a request', async () => {
      let hijackCalled = false;
      Object.prototype.transport = {
        request(options, handleResponse) {
          hijackCalled = true;
          return http.request(options, handleResponse);
        },
      };

      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address();

      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.data.ok, true);
        assert.strictEqual(hijackCalled, false);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }, 10000);
  });
});
