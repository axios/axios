import { describe, it } from 'vitest';
import assert from 'assert';
import http from 'http';
import https from 'https';
import net from 'net';
import fs from 'fs';
import axios from '../../../index.js';
import {
  __getDirectAgent as getDirectAgent,
  __isNodeNativeEnvProxySupported,
} from '../../../lib/adapters/http.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

const nativeProxySupported = __isNodeNativeEnvProxySupported();

function pooledSockets(agent) {
  return [agent.sockets, agent.freeSockets].reduce(function (sockets, pool) {
    return Object.keys(pool).reduce(function (all, key) {
      return all.concat(pool[key]);
    }, sockets);
  }, []);
}

function CustomAgent(options) {
  http.Agent.call(this, options);
}
Object.setPrototypeOf(CustomAgent.prototype, http.Agent.prototype);

describe('direct agent lifecycle', function () {
  it.skipIf(!nativeProxySupported)(
    'destroys both pools through the configured agent',
    async function () {
      var proxy = await startHTTPServer(
        function (req, res) {
          res.end('proxy');
        },
        { keepAlive: 60000 }
      );
      var origin = await startHTTPServer(
        function (req, res) {
          res.end('origin');
        },
        { keepAlive: 60000 }
      );
      var agent = new http.Agent({
        keepAlive: true,
        proxyEnv: {
          HTTP_PROXY: 'http://127.0.0.1:' + proxy.address().port,
          NO_PROXY: '',
        },
      });
      var destroyCalls = 0;
      agent.destroy = function (value) {
        assert.strictEqual(this, agent);
        destroyCalls++;
        http.Agent.prototype.destroy.call(this);
        return value;
      };
      try {
        var url = 'http://127.0.0.1:' + origin.address().port;
        assert.strictEqual((await axios.get(url, { httpAgent: agent })).data, 'proxy');
        var response = await axios.get(url, { httpAgent: agent, proxy: false });
        assert.strictEqual(response.data, 'origin');
        var direct = response.request.agent;
        var sourceSockets = pooledSockets(agent);
        var directSockets = pooledSockets(direct);
        assert.strictEqual(sourceSockets.length, 1);
        assert.strictEqual(directSockets.length, 1);
        assert.strictEqual(agent.destroy('closed'), 'closed');
        assert.strictEqual(destroyCalls, 1);
        assert.ok(sourceSockets[0].destroyed);
        assert.ok(directSockets[0].destroyed);

        response = await axios.get(url, { httpAgent: agent, proxy: false });
        assert.strictEqual(response.data, 'origin');
        assert.notStrictEqual(response.request.socket, directSockets[0]);
        agent.destroy();
        assert.ok(response.request.socket.destroyed);
        assert.strictEqual(destroyCalls, 2);
      } finally {
        agent.destroy();
        await stopHTTPServer(origin);
        await stopHTTPServer(proxy);
      }
    }
  );

  it.skipIf(!nativeProxySupported)(
    'closes a held direct request when the configured agent is destroyed',
    async function () {
      var requestReceived;
      var received = new Promise(function (resolve) {
        requestReceived = resolve;
      });
      var origin = await startHTTPServer(function (req) {
        req.resume();
        requestReceived();
        // Keep the response open until the application destroys its agent.
      });
      var agent = new http.Agent({
        keepAlive: true,
        proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' },
      });
      var direct;
      var closeTimer;
      var pending = axios
        .get('http://127.0.0.1:' + origin.address().port, {
          httpAgent: agent,
          proxy: false,
          timeout: 2000,
        })
        .then(
          function () {
            return new Error('The held request should not complete successfully');
          },
          function (error) {
            return error;
          }
        );
      try {
        await Promise.race([
          received,
          pending.then(function (error) {
            throw error;
          }),
        ]);
        direct = getDirectAgent(agent, http);
        var sockets = Object.keys(direct.sockets).reduce(function (all, key) {
          return all.concat(direct.sockets[key]);
        }, []);
        assert.strictEqual(sockets.length, 1);
        var closed = new Promise(function (resolve) {
          origin.close(resolve);
        });

        agent.destroy();

        assert.ok(sockets[0].destroyed);
        var error = await pending;
        assert.strictEqual(error.code, 'ECONNRESET');
        await Promise.race([
          closed,
          new Promise(function (resolve, reject) {
            closeTimer = setTimeout(function () {
              reject(new Error('Server shutdown is still waiting for the direct socket'));
            }, 1000);
          }),
        ]);
      } finally {
        clearTimeout(closeTimer);
        agent.destroy();
        if (direct) direct.destroy();
        await pending;
        await stopHTTPServer(origin);
      }
    }
  );

  ['own', 'prototype'].forEach(function (placement) {
    it.skipIf(!nativeProxySupported)(
      'preserves ' + placement + ' pool keys and their configured receiver',
      async function () {
        var origin = await startHTTPServer(
          function (req, res) {
            res.end('origin');
          },
          { keepAlive: 60000 }
        );
        var states = new WeakMap();
        function PartitionAgent(options) {
          http.Agent.call(this, options);
          states.set(this, { prefix: 'partition:', calls: 0 });
        }
        Object.setPrototypeOf(PartitionAgent.prototype, http.Agent.prototype);
        var agent = new PartitionAgent({
          keepAlive: true,
          proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' },
        });
        var owner = placement === 'own' ? agent : PartitionAgent.prototype;
        owner.getName = function (options) {
          var state = states.get(this);
          assert.ok(state, 'pool naming must retain the configured receiver');
          state.calls++;
          return (
            state.prefix +
            options.headers['X-Pool'] +
            ':' +
            http.Agent.prototype.getName.call(this, options)
          );
        };
        var target = 'http://127.0.0.1:' + origin.address().port;
        try {
          var first = await axios.get(target, {
            httpAgent: agent,
            proxy: false,
            headers: { 'X-Pool': 'first' },
          });
          var second = await axios.get(target, {
            httpAgent: agent,
            proxy: false,
            headers: { 'X-Pool': 'second' },
          });
          var again = await axios.get(target, {
            httpAgent: agent,
            proxy: false,
            headers: { 'X-Pool': 'first' },
          });
          assert.strictEqual(first.data, 'origin');
          assert.strictEqual(second.data, 'origin');
          assert.strictEqual(again.data, 'origin');
          assert.ok(
            first.request.socket !== second.request.socket,
            'different pool keys need separate sockets'
          );
          assert.ok(
            first.request.socket === again.request.socket,
            'matching pool keys should reuse their socket'
          );
          assert.ok(states.get(agent).calls > 0);
        } finally {
          agent.destroy();
          await stopHTTPServer(origin);
        }
      }
    );
  });

  [
    {
      transport: http,
      slot: 'httpAgent',
      hooks: ['addRequest', 'createSocket', 'removeSocket', 'reuseSocket', 'keepSocketAlive'],
    },
    {
      transport: https,
      slot: 'httpsAgent',
      hooks: ['_getSession', '_cacheSession', '_evictSession'],
    },
  ].forEach(function (fixture) {
    fixture.hooks.forEach(function (hook) {
      ['own', 'prototype'].forEach(function (placement) {
        it.skipIf(!nativeProxySupported)(
          'rejects unsupported ' + placement + ' ' + hook + ' before dispatch',
          async function () {
            function PoolAgent(options) {
              fixture.transport.Agent.call(this, options);
            }
            Object.setPrototypeOf(PoolAgent.prototype, fixture.transport.Agent.prototype);
            var agent = new PoolAgent({
              proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1' },
            });
            var destroy = agent.destroy;
            var calls = 0;
            var owner = placement === 'own' ? agent : PoolAgent.prototype;
            owner[hook] = function () {
              throw new Error('Unsupported hook must not run');
            };
            var config = {
              proxy: false,
              transport: {
                request: function () {
                  calls++;
                  throw new Error('Dispatch must not run');
                },
              },
            };
            config[fixture.slot] = agent;
            try {
              await assert.rejects(
                axios.get(agent.protocol + '//127.0.0.1/resource', config),
                function (error) {
                  return (
                    error.code === 'ERR_BAD_OPTION_VALUE' && error.message.indexOf(hook) !== -1
                  );
                }
              );
              assert.strictEqual(calls, 0);
              assert.strictEqual(agent.destroy, destroy);
            } finally {
              agent.destroy();
            }
          }
        );
      });
    });
  });

  it.skipIf(!nativeProxySupported)(
    'checks lifecycle overrides again before reusing a cached pool',
    function () {
      var agent = new http.Agent({ proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' } });
      try {
        getDirectAgent(agent, http);
        agent.addRequest = function () {
          throw new Error('Unsupported hook must not run');
        };
        assert.throws(
          function () {
            getDirectAgent(agent, http);
          },
          function (error) {
            return error.code === 'ERR_BAD_OPTION_VALUE' && /addRequest/.test(error.message);
          }
        );
      } finally {
        agent.destroy();
      }
    }
  );

  ['own', 'prototype'].forEach(function (placement) {
    it.skipIf(!nativeProxySupported)(
      'preserves ' + placement + ' connection hooks and their configured receiver',
      async function () {
        var origin = await startHTTPServer(function (req, res) {
          res.end('origin');
        });
        function HookAgent(options) {
          http.Agent.call(this, options);
          this.connectionCalls = 0;
        }
        Object.setPrototypeOf(HookAgent.prototype, http.Agent.prototype);
        var agent = new HookAgent({ proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' } });
        var owner = placement === 'own' ? agent : HookAgent.prototype;
        owner.createConnection = function (options, callback) {
          assert.strictEqual(this, agent);
          this.connectionCalls++;
          return net.createConnection(options, callback);
        };
        try {
          var response = await axios.get('http://127.0.0.1:' + origin.address().port, {
            httpAgent: agent,
            proxy: false,
          });
          assert.strictEqual(response.data, 'origin');
          assert.strictEqual(agent.connectionCalls, 1);
        } finally {
          agent.destroy();
          await stopHTTPServer(origin);
        }
      }
    );
  });

  it('leaves unrelated agent options alone', async function () {
    var origin = await startHTTPServer(function (req, res) {
      res.end('origin');
    });
    var unused = new CustomAgent({ proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' } });
    var destroy = unused.destroy;
    Object.defineProperty(unused, 'options', {
      get: function () {
        throw new Error('unused agent options should not be read');
      },
    });
    try {
      var response = await axios.get('http://127.0.0.1:' + origin.address().port, {
        httpsAgent: unused,
        proxy: false,
      });
      assert.strictEqual(response.data, 'origin');
      assert.strictEqual(unused.destroy, destroy);
    } finally {
      unused.destroy();
      await stopHTTPServer(origin);
    }
  });

  it.skipIf(!nativeProxySupported)(
    'selects direct agents on protocol-changing redirects',
    async function () {
      var visited = [];
      var securePort;
      var origin = await startHTTPServer(function (req, res) {
        visited.push('http:' + req.url);
        if (req.url === '/start') {
          res.writeHead(302, { Location: 'https://127.0.0.1:' + securePort + '/next' });
        }
        res.end('origin');
      });
      var secure = https.createServer(
        {
          key: fs.readFileSync(new URL('./key.pem', import.meta.url)),
          cert: fs.readFileSync(new URL('./cert.pem', import.meta.url)),
        },
        function (req, res) {
          visited.push('https:' + req.url);
          res.writeHead(302, { Location: 'http://127.0.0.1:' + origin.address().port + '/end' });
          res.end();
        }
      );
      var httpAgent = new CustomAgent({
        keepAlive: true,
        proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' },
      });
      var httpsAgent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
        proxyEnv: { HTTPS_PROXY: 'http://127.0.0.1:1' },
      });
      try {
        await new Promise(function (resolve) {
          secure.listen(0, '127.0.0.1', resolve);
        });
        securePort = secure.address().port;
        var response = await axios.get('http://127.0.0.1:' + origin.address().port + '/start', {
          httpAgent: httpAgent,
          httpsAgent: httpsAgent,
          proxy: false,
          timeout: 2000,
        });
        assert.strictEqual(response.data, 'origin');
        assert.deepStrictEqual(visited, ['http:/start', 'https:/next', 'http:/end']);
      } finally {
        httpAgent.destroy();
        httpsAgent.destroy();
        await stopHTTPServer(secure);
        await stopHTTPServer(origin);
      }
    }
  );

  it.skipIf(!nativeProxySupported)(
    'keeps direct routing after proxy options are edited',
    async function () {
      var origin = await startHTTPServer(function (req, res) {
        res.end('origin');
      });
      var agent = new CustomAgent({
        proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' },
      });
      delete agent.options.proxyEnv.HTTP_PROXY;
      try {
        var response = await axios.get('http://127.0.0.1:' + origin.address().port, {
          httpAgent: agent,
          proxy: false,
        });
        assert.strictEqual(response.data, 'origin');
      } finally {
        agent.destroy();
        await stopHTTPServer(origin);
      }
    }
  );

  it('leaves custom agents unchanged when native environment proxying is unavailable', function () {
    var descriptor = Object.getOwnPropertyDescriptor(process, 'allowedNodeEnvironmentFlags');
    var agent = new CustomAgent({ proxyEnv: { HTTP_PROXY: 'http://127.0.0.1:1' } });
    try {
      Object.defineProperty(process, 'allowedNodeEnvironmentFlags', { value: new Set() });
      assert.strictEqual(getDirectAgent(agent, http), agent);
    } finally {
      Object.defineProperty(process, 'allowedNodeEnvironmentFlags', descriptor);
      agent.destroy();
    }
  });
});
