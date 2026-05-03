var assert = require('assert');
var shouldBypassProxy = require('../../../lib/helpers/shouldBypassProxy');

var originalNoProxy = process.env.no_proxy;
var originalNOProxy = process.env.NO_PROXY;

function setNoProxy(value) {
  process.env.no_proxy = value;
  process.env.NO_PROXY = value;
}

describe('helpers::shouldBypassProxy', function () {
  afterEach(function () {
    if (originalNoProxy === undefined) {
      delete process.env.no_proxy;
    } else {
      process.env.no_proxy = originalNoProxy;
    }

    if (originalNOProxy === undefined) {
      delete process.env.NO_PROXY;
    } else {
      process.env.NO_PROXY = originalNOProxy;
    }
  });

  it('should bypass proxy for localhost with a trailing dot', function () {
    setNoProxy('localhost,127.0.0.1,::1');
    assert.strictEqual(shouldBypassProxy('http://localhost.:8080/'), true);
  });

  it('should bypass proxy for bracketed ipv6 loopback', function () {
    setNoProxy('localhost,127.0.0.1,::1');
    assert.strictEqual(shouldBypassProxy('http://[::1]:8080/'), true);
  });

  it('should support bracketed ipv6 entries in no_proxy', function () {
    setNoProxy('[::1]');
    assert.strictEqual(shouldBypassProxy('http://[::1]:8080/'), true);
  });

  it('should match wildcard and explicit ports', function () {
    setNoProxy('*.example.com,localhost:8080');

    assert.strictEqual(shouldBypassProxy('http://api.example.com/'), true);
    assert.strictEqual(shouldBypassProxy('http://localhost:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://localhost:8081/'), false);
  });

  it('should treat localhost and loopback IP aliases as equivalent', function () {
    setNoProxy('localhost');

    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::1]:8080/'), true);

    setNoProxy('127.0.0.1');

    assert.strictEqual(shouldBypassProxy('http://localhost:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::1]:8080/'), true);

    setNoProxy('::1');

    assert.strictEqual(shouldBypassProxy('http://localhost:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8080/'), true);
  });

  it('should keep loopback alias matching port-aware', function () {
    setNoProxy('localhost:8080');

    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::1]:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8081/'), false);
  });

  it('should bypass proxy for IPv4-mapped IPv6 loopback when IPv4 is listed', function () {
    setNoProxy('127.0.0.1');

    assert.strictEqual(shouldBypassProxy('http://[::ffff:127.0.0.1]/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::ffff:7f00:1]/'), true);
  });

  it('should bypass proxy for IPv4-mapped IPv6 metadata address when IPv4 is listed', function () {
    setNoProxy('169.254.169.254');

    assert.strictEqual(shouldBypassProxy('http://[::ffff:a9fe:a9fe]/latest/meta-data/'), true);
  });

  it('should support IPv4-mapped IPv6 entries in no_proxy', function () {
    setNoProxy('[::ffff:7f00:1]');

    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::ffff:127.0.0.1]:8080/'), true);
  });

  it('should keep IPv4-mapped IPv6 no_proxy entries port-aware', function () {
    setNoProxy('[::ffff:7f00:1]:8080');

    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::ffff:7f00:1]:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::ffff:7f00:1]:8081/'), false);
  });

  it('should normalise IPv4-mapped IPv6 no_proxy entries regardless of hex case', function () {
    setNoProxy('[::FFFF:7F00:1]');

    assert.strictEqual(shouldBypassProxy('http://127.0.0.1:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://[::ffff:7f00:1]:8080/'), true);
  });
});
