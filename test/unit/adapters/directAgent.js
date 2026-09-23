'use strict';
var assert = require('assert');
var http = require('http');
var https = require('https');
var net = require('net');
var fs = require('fs');
var path = require('path');
var axios = require('../../../index');
var getDirectAgent = require('../../../lib/helpers/getDirectAgent');

function startHTTPServer(handler, options) {
  var server = http.createServer(handler);
  server.keepAliveTimeout = options && options.keepAlive || 1000;
  return new Promise(function(resolve) {
    server.listen(0, '127.0.0.1', function() { resolve(server); });
  });
}

function stopHTTPServer(server) {
  return new Promise(function(resolve) { server.close(resolve); });
}

function nativeGet(target, agent) {
  return new Promise(function(resolve, reject) {
    http.get(target, {agent: agent}, function(response) {
      var body = '';
      response.on('data', function(chunk) { body += chunk; });
      response.on('end', function() { resolve(body); });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Each test configures proxyEnv on its Agent, which works without enabling
// --use-env-proxy at startup. Match the implementation's capability gate.
var nativeProxySupported =
  process.allowedNodeEnvironmentFlags && process.allowedNodeEnvironmentFlags.has('--use-env-proxy');

function pooledSockets(agent) {
  return Object.keys(agent.freeSockets).reduce(function (sockets, key) {
    return sockets.concat(agent.freeSockets[key]);
  }, []);
}

function CustomAgent(options) {
  http.Agent.call(this, options);
}
Object.setPrototypeOf(CustomAgent.prototype, http.Agent.prototype);

describe('direct agent lifecycle', function () {
  (nativeProxySupported ? it : it.skip)(
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
        assert.strictEqual(await nativeGet(url, agent), 'proxy');
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

  (nativeProxySupported ? it : it.skip)(
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

  (nativeProxySupported ? it : it.skip)(
    'preserves live native pool controls before and after caching',
    function() {
      var agent = new https.Agent({
        maxSockets: 10,
        proxyEnv: {HTTPS_PROXY: 'http://127.0.0.1:1'}
      });
      var controls = {
        keepAlive: true,
        keepAliveMsecs: 123,
        maxSockets: 2,
        maxFreeSockets: 2,
        maxTotalSockets: 3,
        scheduling: 'fifo',
        maxCachedSessions: 15,
        agentKeepAliveTimeoutBuffer: 100,
        defaultPort: 8443
      };
      Object.keys(controls).forEach(function(key) { agent[key] = controls[key]; });
      try {
        var direct = getDirectAgent(agent, https);
        Object.keys(controls).forEach(function(key) {
          assert.strictEqual(direct[key], controls[key], key);
        });
        agent.maxSockets = 1;
        agent.maxFreeSockets = 1;
        agent.maxTotalSockets = 2;
        agent.options.timeout = 321;
        assert.strictEqual(getDirectAgent(agent, https), direct);
        assert.strictEqual(direct.maxSockets, 1);
        assert.strictEqual(direct.maxFreeSockets, 1);
        assert.strictEqual(direct.maxTotalSockets, 2);
        assert.strictEqual(direct.options.timeout, 321);
        assert.strictEqual(direct.options.proxyEnv, undefined);
      } finally {
        agent.destroy();
      }
    }
  );

  [http, https].forEach(function(transport) {
    (nativeProxySupported ? it : it.skip)(
      'retains the cached ' + transport.globalAgent.protocol + ' pool after proxy option changes',
      function() {
        var agent = new transport.Agent({
          proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1'}
        });
        try {
          var direct = getDirectAgent(agent, transport);
          var destroy = agent.destroy;
          assert.notStrictEqual(direct, agent);
          [undefined, null, false, 1, 'disabled'].forEach(function(value, index) {
            agent.options.proxyEnv = value;
            agent.options.timeout = 100 + index;
            agent.maxSockets = 2 + index;
            assert.strictEqual(getDirectAgent(agent, transport), direct);
            assert.strictEqual(direct.options.proxyEnv, undefined);
            assert.strictEqual(direct.options.timeout, 100 + index);
            assert.strictEqual(direct.maxSockets, 2 + index);
          });
          delete agent.options.proxyEnv;
          assert.strictEqual(getDirectAgent(agent, transport), direct);
          assert.strictEqual(agent.destroy, destroy);
          agent.options = undefined;
          assert.strictEqual(getDirectAgent(agent, transport), direct);
          assert.strictEqual(direct.options.proxyEnv, undefined);
        } finally {
          agent.destroy();
        }
      }
    );
  });

  (nativeProxySupported ? it : it.skip)(
    'still checks cached pool hooks after proxy options are removed',
    function() {
      var agent = new http.Agent({proxyEnv: {}});
      try {
        getDirectAgent(agent, http);
        delete agent.options.proxyEnv;
        agent.addRequest = function() { throw new Error('Unsupported hook must not run'); };
        assert.throws(function() { getDirectAgent(agent, http); }, function(error) {
          return error.code === 'ERR_BAD_OPTION_VALUE' && /addRequest/.test(error.message);
        });
      } finally {
        agent.destroy();
      }
    }
  );

  (nativeProxySupported ? it : it.skip)(
    'applies a changed socket limit to cached direct requests',
    async function() {
      var firstResponse;
      var firstReceived;
      var received = new Promise(function(resolve) { firstReceived = resolve; });
      var origin = await startHTTPServer(function(req, res) {
        if (req.url === '/wait') {
          firstResponse = res;
          firstReceived();
        } else {
          res.end('next');
        }
      });
      var agent = new http.Agent({
        keepAlive: true,
        proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:1'}
      });
      var direct = getDirectAgent(agent, http);
      agent.maxSockets = 1;
      var target = 'http://127.0.0.1:' + origin.address().port;
      var config = {httpAgent: agent, proxy: false, timeout: 2000};
      var completed = Promise.all([
        axios.get(target + '/wait', config),
        axios.get(target + '/next', config)
      ]);
      completed.catch(function() {});
      try {
        await Promise.race([received, completed]);
        var queued = Object.keys(direct.requests).reduce(function(count, key) {
          return count + direct.requests[key].length;
        }, 0);
        assert.strictEqual(queued, 1);
        assert.strictEqual(direct.totalSocketCount, 1);
        firstResponse.end('first');
        var responses = await completed;
        assert.deepStrictEqual(responses.map(function(response) { return response.data; }), ['first', 'next']);
      } finally {
        if (firstResponse) firstResponse.end();
        agent.destroy();
        await completed.catch(function() {});
        await stopHTTPServer(origin);
      }
    }
  );

  ['own', 'prototype'].forEach(function(placement) {
    (nativeProxySupported ? it : it.skip)(
      'preserves ' + placement + ' pool keys and their configured receiver',
      async function() {
        var origin = await startHTTPServer(function(req, res) { res.end('origin'); }, {keepAlive: 60000});
        var states = new WeakMap();
        function PartitionAgent(options) {
          http.Agent.call(this, options);
          states.set(this, {prefix: 'partition:', calls: 0});
        }
        Object.setPrototypeOf(PartitionAgent.prototype, http.Agent.prototype);
        var agent = new PartitionAgent({
          keepAlive: true,
          proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:1'}
        });
        var owner = placement === 'own' ? agent : PartitionAgent.prototype;
        owner.getName = function(options) {
          var state = states.get(this);
          assert.ok(state, 'pool naming must retain the configured receiver');
          state.calls++;
          return state.prefix + options.headers['X-Pool'] + ':' +
            http.Agent.prototype.getName.call(this, options);
        };
        var target = 'http://127.0.0.1:' + origin.address().port;
        try {
          var first = await axios.get(target, {
            httpAgent: agent, proxy: false, headers: {'X-Pool': 'first'}
          });
          var second = await axios.get(target, {
            httpAgent: agent, proxy: false, headers: {'X-Pool': 'second'}
          });
          var again = await axios.get(target, {
            httpAgent: agent, proxy: false, headers: {'X-Pool': 'first'}
          });
          assert.strictEqual(first.data, 'origin');
          assert.strictEqual(second.data, 'origin');
          assert.strictEqual(again.data, 'origin');
          assert.ok(first.request.socket !== second.request.socket, 'different pool keys need separate sockets');
          assert.ok(first.request.socket === again.request.socket, 'matching pool keys should reuse their socket');
          assert.ok(states.get(agent).calls > 0);
        } finally {
          agent.destroy();
          await stopHTTPServer(origin);
        }
      }
    );
  });

  [
    {transport: http, slot: 'httpAgent', hooks: ['addRequest', 'createSocket', 'removeSocket', 'reuseSocket', 'keepSocketAlive']},
    {transport: https, slot: 'httpsAgent', hooks: ['_getSession', '_cacheSession', '_evictSession']}
  ].forEach(function(fixture) {
    fixture.hooks.forEach(function(hook) {
      ['own', 'prototype'].forEach(function(placement) {
        (nativeProxySupported ? it : it.skip)(
          'rejects unsupported ' + placement + ' ' + hook + ' before dispatch',
          async function() {
            function PoolAgent(options) { fixture.transport.Agent.call(this, options); }
            Object.setPrototypeOf(PoolAgent.prototype, fixture.transport.Agent.prototype);
            var agent = new PoolAgent({
              proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1'}
            });
            var destroy = agent.destroy;
            var calls = 0;
            var owner = placement === 'own' ? agent : PoolAgent.prototype;
            owner[hook] = function() { throw new Error('Unsupported hook must not run'); };
            var config = {
              proxy: false,
              transport: {request: function() { calls++; throw new Error('Dispatch must not run'); }}
            };
            config[fixture.slot] = agent;
            try {
              await assert.rejects(axios.get(agent.protocol + '//127.0.0.1/resource', config), function(error) {
                return error.code === 'ERR_BAD_OPTION_VALUE' && error.message.indexOf(hook) !== -1;
              });
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

  (nativeProxySupported ? it : it.skip)(
    'checks lifecycle overrides again before reusing a cached pool',
    function() {
      var agent = new http.Agent({proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:1'}});
      try {
        getDirectAgent(agent, http);
        agent.addRequest = function() { throw new Error('Unsupported hook must not run'); };
        assert.throws(function() { getDirectAgent(agent, http); }, function(error) {
          return error.code === 'ERR_BAD_OPTION_VALUE' && /addRequest/.test(error.message);
        });
      } finally {
        agent.destroy();
      }
    }
  );

  ['own', 'prototype'].forEach(function (placement) {
    (nativeProxySupported ? it : it.skip)(
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

  (nativeProxySupported ? it : it.skip)(
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
          key: fs.readFileSync(path.join(__dirname, 'key.pem')),
          cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
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

  (nativeProxySupported ? it : it.skip)(
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
        assert.notStrictEqual(response.request.agent, agent);
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
