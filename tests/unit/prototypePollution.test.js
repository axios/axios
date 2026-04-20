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
    delete Object.prototype.auth;
    delete Object.prototype.baseURL;
    delete Object.prototype.socketPath;
    delete Object.prototype.beforeRedirect;
    delete Object.prototype.insecureHTTPParser;
    delete Object.prototype.adapter;
    delete Object.prototype.httpAgent;
    delete Object.prototype.httpsAgent;
    delete Object.prototype.proxy;
    delete Object.prototype.maxContentLength;
    delete Object.prototype.maxBodyLength;
    delete Object.prototype.maxRedirects;
    delete Object.prototype.maxRate;
    delete Object.prototype.timeout;
    delete Object.prototype.transitional;
    delete Object.prototype.timeoutErrorMessage;
    delete Object.prototype.env;
    delete Object.prototype.cancelToken;
    delete Object.prototype.signal;
    delete Object.prototype.decompress;
    delete Object.prototype.params;
    delete Object.prototype.paramsSerializer;
    delete Object.prototype.method;
    delete Object.prototype.withCredentials;
    delete Object.prototype.responseType;
    delete Object.prototype.fetchOptions;
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

  // GHSA-q8qp-cvcw-x6jj: five config properties were read via direct property
  // access in the http adapter and resolveConfig, bypassing hasOwnProperty and
  // allowing prototype pollution gadgets (auth, baseURL, socketPath,
  // beforeRedirect, insecureHTTPParser).
  describe('GHSA-q8qp-cvcw-x6jj http adapter gadgets', () => {
    function startServer(handler) {
      return new Promise((resolve) => {
        const server = http.createServer(handler || ((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ headers: req.headers, url: req.url }));
        }));
        server.listen(0, '127.0.0.1', () => resolve(server));
      });
    }

    function stopServer(server) {
      return new Promise((resolve) => server.close(resolve));
    }

    it('should not pick up Object.prototype.auth as an Authorization header', async () => {
      Object.prototype.auth = { username: 'attacker', password: 'exfil' };

      const server = await startServer();
      const { port } = server.address();

      try {
        const res = await axios.get(`http://127.0.0.1:${port}/api`);
        assert.strictEqual(res.data.headers.authorization, undefined);
      } finally {
        await stopServer(server);
      }
    }, 10000);

    it('should not pick up Object.prototype.socketPath and redirect the request', async () => {
      Object.prototype.socketPath = '/tmp/axios-should-never-be-used.sock';

      const server = await startServer();
      const { port } = server.address();

      try {
        const res = await axios.get(`http://127.0.0.1:${port}/api`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.url, '/api');
      } finally {
        await stopServer(server);
      }
    }, 10000);

    it('should not invoke Object.prototype.beforeRedirect during redirects', async () => {
      let hijackCalled = false;
      Object.prototype.beforeRedirect = function polluted() {
        hijackCalled = true;
      };

      const target = await startServer();
      const { port: targetPort } = target.address();

      const redirector = await startServer((req, res) => {
        res.writeHead(302, { Location: `http://127.0.0.1:${targetPort}/final` });
        res.end();
      });
      const { port: redirectorPort } = redirector.address();

      try {
        const res = await axios.get(`http://127.0.0.1:${redirectorPort}/start`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(hijackCalled, false);
      } finally {
        await stopServer(redirector);
        await stopServer(target);
      }
    }, 10000);

    it('should not enable insecureHTTPParser via Object.prototype', async () => {
      // A raw TCP server emits a response that uses LF-only line terminators
      // instead of CRLF. Node's strict HTTP parser rejects this payload with
      // HPE_CR_EXPECTED; the insecure parser accepts it. Verified: with an
      // explicit `insecureHTTPParser: true` on the request config, this
      // payload is parsed successfully — so if Object.prototype.insecureHTTPParser
      // were picked up, the request would succeed. The request must fail when
      // the gadget is properly blocked.
      Object.prototype.insecureHTTPParser = true;

      const net = await import('net');
      const malformedPayload =
        'HTTP/1.1 200 OK\n' +
        'Content-Type: application/json\n' +
        'Content-Length: 2\n' +
        '\n' +
        '{}';
      const malformed = await new Promise((resolve) => {
        const srv = net.createServer((socket) => {
          socket.once('data', () => socket.end(malformedPayload));
        });
        srv.listen(0, '127.0.0.1', () => resolve(srv));
      });
      const { port } = malformed.address();

      try {
        let threw = false;
        let caughtCode = '';
        try {
          await axios.get(`http://127.0.0.1:${port}/`, {
            transitional: { clarifyTimeoutError: false },
          });
        } catch (err) {
          threw = true;
          caughtCode = String(err && (err.code || err.message));
        }
        assert.strictEqual(
          threw,
          true,
          `request should be rejected by the strict HTTP parser (got: ${caughtCode || 'success'})`
        );
        // The exact llhttp code for LF-only line terminators varies across
        // Node versions (historically HPE_LF_EXPECTED, more recently
        // HPE_CR_EXPECTED). Match any parser error to remain stable across
        // Node releases while still confirming the strict parser rejected
        // the payload.
        assert.match(
          caughtCode,
          /^HPE_/,
          `expected an HPE_* parser error, got: ${caughtCode}`
        );
      } finally {
        await new Promise((resolve) => malformed.close(resolve));
      }
    }, 10000);
  });

  describe('GHSA-q8qp-cvcw-x6jj resolveConfig baseURL gadget', () => {
    // The baseURL branch in buildFullPath only runs when the requested URL is
    // relative (or allowAbsoluteUrls === false). An absolute URL would skip
    // baseURL regardless of pollution and would not exercise the gadget. We
    // therefore issue a relative GET and assert that either:
    //   - the request fails (no host to resolve) because baseURL is correctly
    //     absent from the merged config, OR
    //   - the request is fulfilled without hitting the hijacker.
    // Critically, hijackHit must always be false.
    it('should not hijack relative-URL requests via Object.prototype.baseURL', async () => {
      let hijackHit = false;
      const hijacker = http.createServer((req, res) => {
        hijackHit = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"hijacked":true}');
      });
      await new Promise((resolve) => hijacker.listen(0, '127.0.0.1', resolve));
      const { port: hijackerPort } = hijacker.address();

      Object.prototype.baseURL = `http://127.0.0.1:${hijackerPort}`;

      try {
        let threw = false;
        try {
          await axios.get('/api');
        } catch (_err) {
          threw = true;
        }
        // Either the request fails (desired — no baseURL means no host) or it
        // resolves, but it must NOT hit the polluted hijacker.
        assert.strictEqual(hijackHit, false);
        assert.strictEqual(threw, true);
      } finally {
        await new Promise((resolve) => hijacker.close(resolve));
      }
    }, 10000);

    // Second variant using allowAbsoluteUrls: false to force the baseURL path
    // even for a fully-qualified requested URL.
    it('should not hijack requests via Object.prototype.baseURL with allowAbsoluteUrls:false', async () => {
      let hijackHit = false;
      const hijacker = http.createServer((req, res) => {
        hijackHit = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"hijacked":true}');
      });
      await new Promise((resolve) => hijacker.listen(0, '127.0.0.1', resolve));
      const { port: hijackerPort } = hijacker.address();

      const target = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
      await new Promise((resolve) => target.listen(0, '127.0.0.1', resolve));
      const { port: targetPort } = target.address();

      Object.prototype.baseURL = `http://127.0.0.1:${hijackerPort}`;

      try {
        // If the gadget were picked up, combineURLs(hijacker, `http://target`)
        // would route to the hijacker. It must not.
        let threw = false;
        try {
          await axios.get(`http://127.0.0.1:${targetPort}/api`, {
            allowAbsoluteUrls: false,
          });
        } catch (_err) {
          threw = true;
        }
        assert.strictEqual(hijackHit, false);
        // allowAbsoluteUrls:false + no baseURL → combineURLs not invoked
        // (baseURL falsy) → returns requested URL as-is → target receives it.
        // If baseURL were inherited from prototype, it would be truthy and
        // combineURLs would be invoked, routing to the hijacker.
        assert.strictEqual(threw, false);
      } finally {
        await new Promise((resolve) => hijacker.close(resolve));
        await new Promise((resolve) => target.close(resolve));
      }
    }, 10000);
  });

  // Structural defense: mergeConfig returns a null-prototype object, so any
  // property read that is not an own property of config cannot inherit from
  // Object.prototype. Adding a new key to Object.prototype must never appear
  // as a property of the merged config.
  describe('mergeConfig null-prototype structural defense', () => {
    it('should return an object whose prototype is null', () => {
      const merged = mergeConfig({ url: '/x' }, { method: 'get' });
      assert.strictEqual(Object.getPrototypeOf(merged), null);
    });

    it('should preserve hasOwnProperty as a callable own slot', () => {
      const merged = mergeConfig({}, { url: '/x', method: 'get' });
      assert.strictEqual(typeof merged.hasOwnProperty, 'function');
      assert.strictEqual(merged.hasOwnProperty('url'), true);
      assert.strictEqual(merged.hasOwnProperty('method'), true);
      assert.strictEqual(merged.hasOwnProperty('bogus'), false);
    });

    it('should not serialize hasOwnProperty slot via Object.keys', () => {
      const merged = mergeConfig({ url: '/x' }, {});
      assert.ok(!Object.keys(merged).includes('hasOwnProperty'));
    });

    it('should not expose arbitrary polluted keys as inherited properties', () => {
      Object.prototype.polluted = 'attacker';
      try {
        const merged = mergeConfig({ url: '/x' }, {});
        assert.strictEqual(merged.polluted, undefined);
      } finally {
        delete Object.prototype.polluted;
      }
    });
  });

  // Verify every gadget enumerated in the audit (extension of GHSA-q8qp-cvcw-x6jj)
  // is neutralized end-to-end by the null-prototype config.
  describe('Full gadget coverage via null-prototype config', () => {
    function startEcho(handler) {
      return new Promise((resolve) => {
        const server = http.createServer(handler || ((req, res) => {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              url: req.url,
              method: req.method,
              headers: req.headers,
              body,
            }));
          });
        }));
        server.listen(0, '127.0.0.1', () => resolve(server));
      });
    }
    const stop = (s) => new Promise((r) => s.close(r));

    it('should ignore polluted transformRequest', async () => {
      let invoked = false;
      Object.prototype.transformRequest = function polluted(data) {
        invoked = true;
        return 'INJECTED';
      };

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.post(`http://127.0.0.1:${port}/`, { hello: 'world' });
        assert.strictEqual(invoked, false);
        assert.notStrictEqual(res.data.body, 'INJECTED');
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted transformResponse', async () => {
      let invoked = false;
      Object.prototype.transformResponse = function polluted() {
        invoked = true;
        return 'HIJACKED';
      };

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(invoked, false);
        assert.notStrictEqual(res.data, 'HIJACKED');
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted adapter', async () => {
      let hijacked = false;
      Object.prototype.adapter = function pollutedAdapter() {
        hijacked = true;
        return Promise.resolve({ data: 'pwned', status: 200, statusText: 'OK', headers: {}, config: {}, request: {} });
      };

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/ok`);
        assert.strictEqual(hijacked, false);
        assert.notStrictEqual(res.data, 'pwned');
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted httpAgent', async () => {
      let agentUsed = false;
      Object.prototype.httpAgent = new http.Agent({
        keepAlive: false,
      });
      // Wrap createConnection to detect usage
      const origCreate = Object.prototype.httpAgent.createConnection;
      Object.prototype.httpAgent.createConnection = function (...args) {
        agentUsed = true;
        return origCreate.apply(this, args);
      };

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(agentUsed, false);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted proxy', async () => {
      Object.prototype.proxy = {
        protocol: 'http',
        host: '127.0.0.1',
        port: 1, // would fail if actually used
      };

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted maxContentLength', async () => {
      // Polluted tiny limit would reject a normal response if applied.
      Object.prototype.maxContentLength = 1;

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted maxRedirects', async () => {
      // Pollute with 0 — if picked up, follow-redirects path would be skipped.
      // We make sure regular requests still succeed via the expected path.
      Object.prototype.maxRedirects = 0;

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted timeout at the merged config level', () => {
      Object.prototype.timeout = 1;
      const merged = mergeConfig({}, { url: '/x' });
      assert.strictEqual(Object.prototype.hasOwnProperty.call(merged, 'timeout'), false);
      assert.strictEqual(merged.timeout, undefined);
    });

    it('should ignore polluted timeoutErrorMessage', async () => {
      Object.prototype.timeoutErrorMessage = 'INJECTED_TIMEOUT';
      // Not easy to assert without triggering a real timeout; just confirm
      // normal requests still succeed and do not read the polluted key.
      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted transitional', async () => {
      Object.prototype.transitional = { forcedJSONParsing: true, silentJSONParsing: false };
      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted params and paramsSerializer', async () => {
      let serializerInvoked = false;
      Object.prototype.params = { injected: 'yes' };
      Object.prototype.paramsSerializer = function polluted() {
        serializerInvoked = true;
        return 'injected=yes';
      };

      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/x`);
        assert.strictEqual(serializerInvoked, false);
        assert.strictEqual(res.data.url, '/x');
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted method', async () => {
      Object.prototype.method = 'DELETE';
      const server = await startEcho();
      const { port } = server.address();
      try {
        // axios.get should still send GET, not DELETE.
        const res = await axios.get(`http://127.0.0.1:${port}/ok`);
        assert.strictEqual(res.data.method, 'GET');
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted decompress', async () => {
      Object.prototype.decompress = false;
      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        assert.strictEqual(res.status, 200);
      } finally {
        await stop(server);
      }
    }, 10000);

    it('should ignore polluted responseType', async () => {
      Object.prototype.responseType = 'arraybuffer';
      const server = await startEcho();
      const { port } = server.address();
      try {
        const res = await axios.get(`http://127.0.0.1:${port}/`);
        // When responseType is not set on config, json parsing should apply
        // and res.data should be an object, not an ArrayBuffer/Buffer.
        assert.strictEqual(typeof res.data, 'object');
        assert.ok(!Buffer.isBuffer(res.data));
      } finally {
        await stop(server);
      }
    }, 10000);
  });
});
