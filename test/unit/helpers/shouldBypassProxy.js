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
});
