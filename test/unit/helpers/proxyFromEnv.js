var assert = require('assert');
var http = require('http');
var axios = require('../../../index');
var proxyFromEnv = require('../../../lib/helpers/proxyFromEnv');
var shouldBypassProxy = require('../../../lib/helpers/shouldBypassProxy');

var getProxyForUrl = proxyFromEnv.getProxyForUrl;

var ENV_KEYS = [
  'http_proxy', 'HTTP_PROXY',
  'https_proxy', 'HTTPS_PROXY',
  'all_proxy', 'ALL_PROXY',
  'no_proxy', 'NO_PROXY',
  'npm_config_proxy', 'NPM_CONFIG_PROXY',
  'npm_config_http_proxy', 'NPM_CONFIG_HTTP_PROXY',
  'npm_config_https_proxy', 'NPM_CONFIG_HTTPS_PROXY',
  'npm_config_no_proxy', 'NPM_CONFIG_NO_PROXY'
];

describe('helpers::proxyFromEnv', function () {
  var savedEnv;

  function clearInherited() {
    ENV_KEYS.forEach(function (key) {
      delete Object.prototype[key];
    });
  }

  beforeEach(function () {
    savedEnv = {};
    ENV_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        savedEnv[key] = process.env[key];
      }
      delete process.env[key];
    });
    clearInherited();
  });

  afterEach(function () {
    clearInherited();
    ENV_KEYS.forEach(function (key) {
      delete process.env[key];
      if (Object.prototype.hasOwnProperty.call(savedEnv, key)) {
        process.env[key] = savedEnv[key];
      }
    });
  });

  describe('getProxyForUrl', function () {
    it('should return an empty string when no proxy variable is set', function () {
      assert.strictEqual(getProxyForUrl('http://example.com/'), '');
    });

    it('should use the proxy variable for the request scheme', function () {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.HTTPS_PROXY = 'http://secure-proxy.local:8443';

      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://proxy.local:8080');
      assert.strictEqual(getProxyForUrl('https://example.com/'), 'http://secure-proxy.local:8443');
    });

    it('should prefer the lower-case variable over the upper-case one', function () {
      process.env.http_proxy = 'http://lower.local:1';
      process.env.HTTP_PROXY = 'http://upper.local:2';

      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://lower.local:1');
    });

    it('should fall back to npm_config and all_proxy variables in order', function () {
      process.env.all_proxy = 'http://all.local:1';
      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://all.local:1');

      process.env.npm_config_proxy = 'http://npm.local:2';
      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://npm.local:2');

      process.env.http_proxy = 'http://scheme.local:3';
      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://scheme.local:3');

      process.env.npm_config_http_proxy = 'http://npm-scheme.local:4';
      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://npm-scheme.local:4');
    });

    it('should default a proxy without a scheme to the request scheme', function () {
      process.env.HTTPS_PROXY = 'proxy.local:8443';

      assert.strictEqual(getProxyForUrl('https://example.com/'), 'https://proxy.local:8443');
    });

    it('should return an empty string for URLs without a host or scheme', function () {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';

      assert.strictEqual(getProxyForUrl('/relative/path'), '');
      assert.strictEqual(getProxyForUrl(''), '');
    });

    it('should not proxy hosts matched by no_proxy', function () {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.NO_PROXY = 'internal.local,.corp.local,*.svc,example.com:8080';

      assert.strictEqual(getProxyForUrl('http://internal.local/'), '');
      assert.strictEqual(getProxyForUrl('http://a.corp.local/'), '');
      assert.strictEqual(getProxyForUrl('http://api.svc/'), '');
      assert.strictEqual(getProxyForUrl('http://example.com:8080/'), '');
      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://proxy.local:8080');
      assert.strictEqual(getProxyForUrl('http://other.local/'), 'http://proxy.local:8080');
    });

    it('should not proxy anything when no_proxy is a wildcard', function () {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.no_proxy = '*';

      assert.strictEqual(getProxyForUrl('http://example.com/'), '');
    });

    it('should ignore proxy variables inherited from Object.prototype', function () {
      Object.prototype.http_proxy = 'http://inherited.local:1';
      Object.prototype.HTTPS_PROXY = 'http://inherited.local:2';
      Object.prototype.all_proxy = 'http://inherited.local:3';
      Object.prototype.npm_config_proxy = 'http://inherited.local:4';

      assert.strictEqual(getProxyForUrl('http://example.com/'), '');
      assert.strictEqual(getProxyForUrl('https://example.com/'), '');
    });

    it('should not let an inherited lower-case variable override the real one', function () {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      Object.prototype.http_proxy = 'http://inherited.local:1';

      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://proxy.local:8080');
    });

    it('should ignore an inherited no_proxy value', function () {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      Object.prototype.no_proxy = '*';
      Object.prototype.npm_config_no_proxy = '*';

      assert.strictEqual(getProxyForUrl('http://example.com/'), 'http://proxy.local:8080');
    });
  });

  describe('shouldBypassProxy', function () {
    it('should ignore an inherited no_proxy value', function () {
      Object.prototype.no_proxy = '*';
      Object.prototype.NO_PROXY = 'example.com';

      assert.strictEqual(shouldBypassProxy('http://example.com/'), false);
    });

    it('should still honour a real no_proxy value', function () {
      process.env.NO_PROXY = 'example.com';

      assert.strictEqual(shouldBypassProxy('http://example.com/'), true);
    });
  });

  describe('http adapter', function () {
    var target;
    var proxy;
    var proxyHits;

    function listen(server) {
      return new Promise(function (resolve) {
        server.listen(0, '127.0.0.1', function () {
          resolve(server.address().port);
        });
      });
    }

    function close(server) {
      return new Promise(function (resolve) {
        server.close(function () {
          resolve();
        });
      });
    }

    beforeEach(function () {
      proxyHits = 0;
      target = http.createServer(function (req, res) {
        res.end('target');
      });
      proxy = http.createServer(function (req, res) {
        proxyHits++;
        res.end('proxy');
      });

      return Promise.all([listen(target), listen(proxy)]);
    });

    afterEach(function () {
      return Promise.all([close(target), close(proxy)]);
    });

    it('should not route requests through a proxy inherited from Object.prototype', function () {
      var targetUrl = 'http://127.0.0.1:' + target.address().port + '/';
      var proxyUrl = 'http://127.0.0.1:' + proxy.address().port;

      Object.prototype.http_proxy = proxyUrl;
      Object.prototype.HTTP_PROXY = proxyUrl;
      Object.prototype.all_proxy = proxyUrl;

      return axios.get(targetUrl).then(function (response) {
        assert.strictEqual(response.data, 'target');
        assert.strictEqual(proxyHits, 0);
      });
    });

    it('should still route requests through a proxy set in the environment', function () {
      var targetUrl = 'http://127.0.0.1:' + target.address().port + '/';

      process.env.HTTP_PROXY = 'http://127.0.0.1:' + proxy.address().port;

      return axios.get(targetUrl).then(function (response) {
        assert.strictEqual(response.data, 'proxy');
        assert.strictEqual(proxyHits, 1);
      });
    });

    it('should not skip a configured proxy because of an inherited no_proxy value', function () {
      var targetUrl = 'http://127.0.0.1:' + target.address().port + '/';

      process.env.HTTP_PROXY = 'http://127.0.0.1:' + proxy.address().port;
      Object.prototype.no_proxy = '*';
      Object.prototype.NO_PROXY = '*';

      return axios.get(targetUrl).then(function (response) {
        assert.strictEqual(response.data, 'proxy');
        assert.strictEqual(proxyHits, 1);
      });
    });
  });
});
