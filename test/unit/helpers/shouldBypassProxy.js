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

  it('should treat 0.0.0.0 as a local address for no_proxy matching', function () {
    setNoProxy('localhost,127.0.0.1,::1');

    assert.strictEqual(shouldBypassProxy('http://0.0.0.0:8080/'), true);
  });

  it('should keep 0.0.0.0 no_proxy matching port-aware', function () {
    setNoProxy('localhost:8080');

    assert.strictEqual(shouldBypassProxy('http://0.0.0.0:8080/'), true);
    assert.strictEqual(shouldBypassProxy('http://0.0.0.0:8081/'), false);
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

  describe('CIDR entries', function () {
    it('should bypass proxy for an address inside an IPv4 range', function () {
      setNoProxy('127.0.0.0/8');

      assert.strictEqual(shouldBypassProxy('http://127.0.0.1:1234/'), true);
      assert.strictEqual(shouldBypassProxy('http://127.255.255.254/'), true);
    });

    it('should not bypass proxy for an address outside an IPv4 range', function () {
      setNoProxy('10.0.0.0/8');

      assert.strictEqual(shouldBypassProxy('http://10.1.2.3/'), true);
      assert.strictEqual(shouldBypassProxy('http://11.1.2.3/'), false);
    });

    it('should honour a partial-byte prefix length', function () {
      setNoProxy('172.16.0.0/12');

      assert.strictEqual(shouldBypassProxy('http://172.16.0.1/'), true);
      assert.strictEqual(shouldBypassProxy('http://172.31.255.254/'), true);
      assert.strictEqual(shouldBypassProxy('http://172.32.0.1/'), false);
      assert.strictEqual(shouldBypassProxy('http://172.15.255.254/'), false);
    });

    it('should support a single-address range for a metadata endpoint', function () {
      setNoProxy('169.254.169.254/32');

      assert.strictEqual(shouldBypassProxy('http://169.254.169.254/latest/meta-data/'), true);
      assert.strictEqual(shouldBypassProxy('http://169.254.169.253/latest/meta-data/'), false);
    });

    it('should match a zero-length prefix against every IPv4 address', function () {
      setNoProxy('0.0.0.0/0');

      assert.strictEqual(shouldBypassProxy('http://8.8.8.8/'), true);
    });

    it('should support IPv6 ranges', function () {
      setNoProxy('[fd00::]/8');

      assert.strictEqual(shouldBypassProxy('http://[fd12::3]/'), true);
      assert.strictEqual(shouldBypassProxy('http://[fe12::3]/'), false);
    });

    it('should support an unbracketed IPv6 range', function () {
      setNoProxy('::1/128');

      assert.strictEqual(shouldBypassProxy('http://[::1]:9/'), true);
    });

    it('should not match an IPv4 host against an IPv6 range', function () {
      setNoProxy('[fd00::]/8');

      assert.strictEqual(shouldBypassProxy('http://10.1.2.3/'), false);
    });

    it('should not match a named host against a range', function () {
      setNoProxy('10.0.0.0/8');

      assert.strictEqual(shouldBypassProxy('http://localhost/'), false);
      assert.strictEqual(shouldBypassProxy('http://example.com/'), false);
    });

    it('should ignore malformed range entries instead of matching everything', function () {
      setNoProxy('bogus/33');

      assert.strictEqual(shouldBypassProxy('http://1.2.3.4/'), false);
    });

    it('should ignore an out-of-range prefix length', function () {
      setNoProxy('10.0.0.0/33');

      assert.strictEqual(shouldBypassProxy('http://10.1.2.3/'), false);
    });

    it('should still match plain host entries listed alongside a range', function () {
      setNoProxy('10.0.0.0/8,example.com');

      assert.strictEqual(shouldBypassProxy('http://example.com/'), true);
      assert.strictEqual(shouldBypassProxy('http://10.1.2.3/'), true);
    });

    it('should match a zero-length IPv6 prefix against every IPv6 address', function () {
      setNoProxy('::/0');

      assert.strictEqual(shouldBypassProxy('http://[2001:db8::1]/'), true);
    });

    it('should honour an IPv6 prefix that is not byte aligned', function () {
      setNoProxy('fe80::/10');

      assert.strictEqual(shouldBypassProxy('http://[fe80::1]/'), true);
      assert.strictEqual(shouldBypassProxy('http://[fec0::1]/'), false);
    });

    it('should accept a fully expanded IPv6 range entry', function () {
      setNoProxy('2001:db8:0:0:0:0:0:0/32');

      assert.strictEqual(shouldBypassProxy('http://[2001:db8::9]/'), true);
      assert.strictEqual(shouldBypassProxy('http://[2001:db9::9]/'), false);
    });

    it('should accept an IPv6 range entry with all eight groups', function () {
      setNoProxy('1:2:3:4:5:6:7:8/128');

      assert.strictEqual(shouldBypassProxy('http://[1:2:3:4:5:6:7:8]/'), true);
    });

    it('should reject an IPv6 range with too many groups', function () {
      setNoProxy('1:2:3:4:5:6:7:8:9/128');

      assert.strictEqual(shouldBypassProxy('http://[1:2:3:4:5:6:7:8]/'), false);
    });

    it('should reject an IPv6 range with a repeated compression marker', function () {
      setNoProxy('1::2::3/16');

      assert.strictEqual(shouldBypassProxy('http://[1::]/'), false);
    });

    it('should reject an IPv6 range with invalid hex groups', function () {
      setNoProxy('gggg::/16');

      assert.strictEqual(shouldBypassProxy('http://[1::]/'), false);
    });

    it('should reject an IPv6 range whose dotted quad precedes the compression marker', function () {
      // A dotted quad only stands for the final 32 bits, so it cannot sit before
      // `::`. Expanding it anyway read this entry as 102:304::/64 and bypassed
      // the proxy for a network the operator never listed.
      setNoProxy('1.2.3.4::/64');

      assert.strictEqual(shouldBypassProxy('http://[102:304::1]/'), false);
      assert.strictEqual(shouldBypassProxy('http://[1:2:3:4::1]/'), false);
    });

    it('should reject an IPv6 range with a dotted quad in the middle of the head', function () {
      setNoProxy('a:1.2.3.4::/32');

      assert.strictEqual(shouldBypassProxy('http://[a:102::1]/'), false);
    });

    it('should reject a compressed IPv6 range that already spells out all eight groups', function () {
      // `::` stands for at least one group of zeros, so this entry is malformed.
      // Accepting it parsed the prefix as a valid /0 network, which matched every
      // IPv6 destination.
      setNoProxy('1:2:3:4:5:6:7:8::/0');

      assert.strictEqual(shouldBypassProxy('http://[dead:beef::1]/'), false);
      assert.strictEqual(shouldBypassProxy('http://[1:2:3:4:5:6:7:8]/'), false);
    });

    it('should reject a compressed IPv6 range that compresses nothing', function () {
      setNoProxy('1:2:3:4::5:6:7:8/64');

      assert.strictEqual(shouldBypassProxy('http://[1:2:3:4:aaaa::1]/'), false);
    });

    it('should reject an IPv6 prefix longer than 128 bits', function () {
      setNoProxy('2001:db8::/129');

      assert.strictEqual(shouldBypassProxy('http://[2001:db8::9]/'), false);
    });

    it('should match an IPv4-mapped IPv6 host against an IPv4 range', function () {
      setNoProxy('10.0.0.0/8');

      assert.strictEqual(shouldBypassProxy('http://[::ffff:10.0.0.1]/'), true);
    });

    it('should reject a range whose octets carry leading zeros', function () {
      // The URL parser reads 010.0.0.1 as octal, so `http://010.0.0.1/` arrives
      // as 8.0.0.1. A decimal read of the entry would be 10.0.0.0/8 and would
      // silently cover hosts the operator never named.
      setNoProxy('010.0.0.0/8');

      assert.strictEqual(shouldBypassProxy('http://10.1.2.3/'), false);
      assert.strictEqual(shouldBypassProxy('http://8.1.2.3/'), false);
    });

    it('should still match an equivalent range written without leading zeros', function () {
      setNoProxy('8.0.0.0/8');

      assert.strictEqual(shouldBypassProxy('http://010.0.0.1/'), true);
    });
  });

  it('should not match a leading-zero host entry against the decimal address', function () {
    setNoProxy('010.0.0.1');

    assert.strictEqual(shouldBypassProxy('http://10.0.0.1/'), false);
  });

  it('should still treat a zero-padded loopback entry as loopback', function () {
    setNoProxy('127.000.000.001');

    assert.strictEqual(shouldBypassProxy('http://127.0.0.1/'), true);
  });

  it('should normalise a long run of trailing dots in linear time', function () {
    setNoProxy('example.com');

    // A hostname of many dots followed by a non-dot character used to backtrack
    // quadratically during trailing-dot normalisation. Hostnames reach this
    // helper from redirect Location values, so the cost must stay linear.
    // Scaling is asserted rather than wall-clock, so a slow or loaded machine
    // does not make this flaky.
    function timeHostname(dotCount) {
      var hostname = new Array(dotCount + 1).join('.') + 'a';
      var best = Infinity;

      for (var run = 0; run < 3; run++) {
        var started = process.hrtime();
        shouldBypassProxy('http://' + hostname + '/');
        var elapsed = process.hrtime(started);
        best = Math.min(best, elapsed[0] * 1e9 + elapsed[1]);
      }

      return best;
    }

    timeHostname(1000);

    var small = timeHostname(10000);
    var large = timeHostname(100000);
    var growth = large / Math.max(small, 1);

    // Ten times the input costs roughly ten times the work when the scan is
    // linear. The previous anchored /\.+$/ grew by roughly a hundred times.
    assert.ok(
      growth < 25,
      'trailing-dot normalisation should scale linearly, saw ' + growth.toFixed(1) + 'x for 10x input'
    );
  });

  it('should ignore trailing dots when matching a no_proxy entry', function () {
    setNoProxy('example.com');

    assert.strictEqual(shouldBypassProxy('http://example.com.../'), true);
  });
});
