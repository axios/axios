'use strict';
var assert = require('assert');
var http = require('http');
var https = require('https');
var net = require('net');
var fs = require('fs');
var path = require('path');
var axios = require('../../../index');
var getDirectAgent = require('../../../lib/helpers/getDirectAgent');
var shouldBypassProxy = require('../../../lib/helpers/shouldBypassProxy');

function listen(server) {
  return new Promise(function(resolve) {
    server.listen(0, '127.0.0.1', function() { resolve(server.address().port); });
  });
}
function close(server) {
  return new Promise(function(resolve) { server.close(resolve); });
}
function lookup(hostname, options, callback) {
  if (options && options.all) callback(null, [{address: '127.0.0.1', family: 4}]);
  else callback(null, '127.0.0.1', 4);
}
function nativeProxySupported() {
  var version = process.versions.node.split('.').map(Number);
  return version[0] > 24 || version[0] === 24 && version[1] >= 5 ||
    version[0] === 22 && version[1] >= 21;
}

describe('HTTP routing consistency', function() {

  it('honors direct HTTPS requests with native proxy agents', async function() {
    if (!nativeProxySupported()) return;
    var targets = [];
    var sockets = [];
    var port;
    var origin = https.createServer({
      key: fs.readFileSync(path.join(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    }, function(req, res) {
      res.end('direct');
    });
    var proxy = http.createServer();
    proxy.on('connect', function(req, socket, head) {
      targets.push(req.url);
      var upstream = net.connect(port, '127.0.0.1', function() {
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstream.write(head);
        socket.pipe(upstream);
        upstream.pipe(socket);
      });
      sockets.push(socket, upstream);
      upstream.on('error', function() { socket.destroy(); });
      socket.on('error', function() { upstream.destroy(); });
    });
    var agent;
    try {
      port = await listen(origin);
      var proxyPort = await listen(proxy);
      agent = new https.Agent({
        rejectUnauthorized: false,
        proxyEnv: {HTTPS_PROXY: 'http://127.0.0.1:' + proxyPort, NO_PROXY: ''}
      });
      var target = 'https://127.0.0.1:' + port + '/';
      var control = await axios.get(target, {httpsAgent: agent, timeout: 2000});
      assert.strictEqual(control.data, 'direct');
      assert.strictEqual(targets.length, 1);
      for (var redirects = 0; redirects < 2; redirects++) {
        var response = await axios.get(target, {
          proxy: false, httpsAgent: agent, maxRedirects: redirects ? 5 : 0, timeout: 2000
        });
        assert.strictEqual(response.data, 'direct');
      }
      assert.strictEqual(targets.length, 1);
    } finally {
      if (agent) {
        getDirectAgent(agent, https).destroy();
        agent.destroy();
      }
      sockets.forEach(function(socket) { socket.destroy(); });
      await close(proxy);
      await close(origin);
    }
  });

  it('requires an explicit direct configuration for custom native proxy agents', function() {
    function CustomAgent() {
      http.Agent.call(this, {proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:1'}});
    }
    Object.setPrototypeOf(CustomAgent.prototype, http.Agent.prototype);
    var agent = new CustomAgent();
    try {
      assert.throws(function() { getDirectAgent(agent, http); }, function(error) {
        return error.code === 'ERR_BAD_OPTION_VALUE';
      });
    } finally {
      agent.destroy();
    }
  });

  it('uses npm bypass entries with the same precedence as proxy selection', async function() {
    var keys = ['http_proxy', 'HTTP_PROXY', 'all_proxy', 'ALL_PROXY',
      'npm_config_http_proxy', 'NPM_CONFIG_HTTP_PROXY', 'npm_config_proxy', 'NPM_CONFIG_PROXY',
      'no_proxy', 'NO_PROXY', 'npm_config_no_proxy', 'NPM_CONFIG_NO_PROXY'];
    var saved = {};
    keys.forEach(function(key) { saved[key] = process.env[key]; delete process.env[key]; });
    var proxyHits = 0;
    var proxy = http.createServer(function(req, res) { proxyHits++; res.end('proxied'); });
    var origin = http.createServer(function(req, res) { res.end('direct'); });
    var agent = new http.Agent({lookup: lookup});
    try {
      var proxyPort = await listen(proxy);
      var port = await listen(origin);
      process.env.npm_config_http_proxy = 'http://127.0.0.1:' + proxyPort;
      process.env.NO_PROXY = 'unrelated.example';
      for (var i = 0; i < 2; i++) {
        var key = i ? 'NPM_CONFIG_NO_PROXY' : 'npm_config_no_proxy';
        process.env[key] = 'localhost';
        var response = await axios.get('http://localhost.:' + port + '/', {
          httpAgent: agent, timeout: 2000
        });
        assert.strictEqual(response.data, 'direct');
        delete process.env[key];
      }
      assert.strictEqual(proxyHits, 0);
      process.env.npm_config_no_proxy = 'unrelated.example';
      process.env.NO_PROXY = 'localhost';
      var control = await axios.get('http://localhost.:' + port + '/', {
        httpAgent: agent, timeout: 2000
      });
      assert.strictEqual(control.data, 'proxied');
      assert.strictEqual(proxyHits, 1);
    } finally {
      keys.forEach(function(key) {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
      });
      agent.destroy();
      await close(proxy);
      await close(origin);
    }
  });

  [false, true].forEach(function(changeOrigin) {
    it('handles request headers on ' + (changeOrigin ? 'child-host' : 'same-origin') + ' redirects', async function() {
      var received;
      var port;
      var server = http.createServer(function(req, res) {
        if (req.url === '/start') {
          res.writeHead(302, {Location: 'http://' + (changeOrigin ? 'child.' : '') +
            'api.example.invalid:' + port + '/end'});
          res.end();
        } else {
          received = req.headers;
          res.end('ok');
        }
      });
      var agent = new http.Agent({lookup: lookup});
      try {
        port = await listen(server);
        await axios.get('http://api.example.invalid:' + port + '/start', {
          proxy: false, httpAgent: agent,
          headers: {Authorization: 'Bearer example', Cookie: 'session=example'},
          timeout: 2000
        });
        assert.strictEqual(received.authorization, changeOrigin ? undefined : 'Bearer example');
        assert.strictEqual(received.cookie, changeOrigin ? undefined : 'session=example');
      } finally {
        agent.destroy();
        await close(server);
      }
    });
  });

  it('honors direct requests with native proxy agents and redirects', async function() {
    if (!nativeProxySupported()) return;
    var proxyHits = 0;
    var directHeaders;
    var proxy = http.createServer(function(req, res) {
      proxyHits++;
      res.end('proxied');
    });
    var origin = http.createServer(function(req, res) {
      if (req.url === '/start') {
        res.writeHead(302, {Location: '/end'});
        res.end();
      } else {
        directHeaders = req.headers;
        res.end('direct');
      }
    });
    var originalAgent = http.globalAgent;
    var agent;
    try {
      var proxyPort = await listen(proxy);
      var port = await listen(origin);
      agent = new http.Agent({
        keepAlive: true,
        proxyEnv: {HTTP_PROXY: 'http://127.0.0.1:' + proxyPort, NO_PROXY: ''}
      });
      http.globalAgent = agent;
      var url = 'http://127.0.0.1:' + port;
      var control = await axios.get(url + '/end', {httpAgent: agent, timeout: 2000});
      assert.strictEqual(control.data, 'proxied');
      assert.strictEqual(proxyHits, 1);
      for (var supplied = 0; supplied < 2; supplied++) {
        for (var redirects = 0; redirects < 2; redirects++) {
          var response = await axios.get(url + (redirects ? '/start' : '/end'), {
            proxy: false,
            httpAgent: supplied ? agent : undefined,
            maxRedirects: redirects ? 5 : 0,
            headers: {Authorization: 'Bearer example'},
            timeout: 2000
          });
          assert.strictEqual(response.data, 'direct');
          assert.strictEqual(directHeaders.authorization, 'Bearer example');
        }
      }
      assert.strictEqual(proxyHits, 1);
      assert.ok(agent.options.proxyEnv.HTTP_PROXY);
    } finally {
      http.globalAgent = originalAgent;
      if (agent) {
        getDirectAgent(agent, http).destroy();
        agent.destroy();
      }
      await close(proxy);
      await close(origin);
    }
  });

  it('keeps direct agent options and reuses their connection pool', function() {
    var agent = new https.Agent({
      ca: 'example-ca',
      rejectUnauthorized: false,
      maxSockets: 3,
      proxyEnv: {HTTPS_PROXY: 'http://127.0.0.1:1'}
    });
    try {
      var direct = getDirectAgent(agent, https);
      assert.notStrictEqual(direct, agent);
      assert.strictEqual(getDirectAgent(agent, https), direct);
      assert.strictEqual(direct.options.ca, 'example-ca');
      assert.strictEqual(direct.options.rejectUnauthorized, false);
      assert.strictEqual(direct.maxSockets, 3);
      assert.strictEqual(direct.options.proxyEnv, undefined);
      direct.destroy();
    } finally {
      agent.destroy();
    }
  });

  it('matches equivalent host spellings in bypass entries', function() {
    var original = {};
    var keys = ['no_proxy', 'NO_PROXY', 'npm_config_no_proxy', 'NPM_CONFIG_NO_PROXY'];
    keys.forEach(function(key) { original[key] = process.env[key]; delete process.env[key]; });
    try {
      [
        ['bücher.example', 'http://xn--bcher-kva.example/', true],
        ['xn--bcher-kva.example', 'http://bücher.example/', true],
        ['.bücher.example', 'http://child.xn--bcher-kva.example/', true],
        ['*.bücher.example:8080', 'http://child.bücher.example:8080/', true],
        ['*.bücher.example:8080', 'http://child.bücher.example:8081/', false],
        ['bücher.example', 'http://other.example/', false],
        ['[2001:0db8:0000:0000:0000:0000:0000:0001]', 'http://[2001:db8::1]/', true],
        ['2001:db8:0:0:0:0:0:1', 'http://[2001:db8::1]/', true],
        ['[2001:db8:0:0:0:0:0:1]:8080', 'http://[2001:db8::1]:8081/', false],
        ['[2001:db8::1]', 'http://[2001:db8::2]/', false]
      ].forEach(function(example) {
        process.env.no_proxy = example[0];
        assert.strictEqual(shouldBypassProxy(example[1]), example[2], example[0]);
      });
    } finally {
      keys.forEach(function(key) {
        if (original[key] === undefined) delete process.env[key];
        else process.env[key] = original[key];
      });
    }
  });
});
