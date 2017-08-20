'use strict';

var getProxy = require('../../../lib/adapters/http.proxy');

function config(def) {
  var cfg = {};
  cfg.url = def && def.url || 'http://google.com';
  cfg.proxy = def && def.proxy;
  return cfg;
}


module.exports = {

  setUp: function(done) {
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    delete process.env.no_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.NO_PROXY;
    done();
  },

  isEmptyIfNotConfigured: function(test) {
    test.equal(getProxy(config()), undefined);
    test.done();
  },

  canReadProxyHostFromConfig: function(test) {
    var cfg = config({proxy: {host: 'corpproxy.com'}});
    var proxy = getProxy(cfg);
    test.equal(proxy.host, 'corpproxy.com');
    test.equal(proxy.port, undefined);
    test.equal(proxy.auth, undefined);
    test.done();
  },

  canReadProxyAndPortHostFromConfig: function(test) {
    var cfg = config({proxy: {host: 'corpproxy.com', port: 80}});
    var proxy = getProxy(cfg);
    test.equal(proxy.host, 'corpproxy.com');
    test.equal(proxy.port, 80);
    test.equal(proxy.auth, undefined);
    test.done();
  },


  canReadProxyAndAuthHostFromConfig: function(test) {
    var cfg = config({proxy: {host: 'corpproxy.com', auth: {password: 'secret', username: 'bob'}}});
    var proxy = getProxy(cfg);
    test.equal(proxy.host, 'corpproxy.com');
    test.equal(proxy.port, undefined);
    test.deepEqual(proxy.auth, {password: 'secret', username: 'bob'});
    test.done();
  },

  canReadProxyHostFromEnv: function(test) {
    process.env.http_proxy = 'http://corpproxy.com/';
    var proxy = getProxy(config());
    test.equal(proxy.host, 'corpproxy.com');
    test.equal(proxy.port, undefined);
    test.equal(proxy.auth, undefined);
    test.done();
  },

  canReadProxyHostAndPortFromEnv: function(test) {
    process.env.http_proxy = 'http://corpproxy.com:77/';
    var proxy = getProxy(config());
    test.equal(proxy.host, 'corpproxy.com');
    test.equal(proxy.port, 77);
    test.equal(proxy.auth, undefined);
    test.done();
  },

  canReadProxyHostAndPortAndAuthFromEnv: function(test) {
    process.env.http_proxy = 'http://bob:secret@corpproxy.com:77/';
    var proxy = getProxy(config());
    test.equal(proxy.host, 'corpproxy.com');
    test.equal(proxy.port, 77);
    test.deepEqual(proxy.auth, {username: 'bob', password: 'secret'});
    test.done();
  },

  proxyFromConfigOverridesProxyFromEnv: function(test) {
    process.env.http_proxy = 'http://bob:secret@corpproxy.com:77/';
    var proxy = getProxy(config({proxy: {host: 'other-host.com'}}));
    test.equal(proxy.host, 'other-host.com');
    test.equal(proxy.port, undefined);
    test.equal(proxy.auth, undefined);
    test.done();
  },

  readProxyFromCorrectEnv: function(test) {
    process.env.https_proxy = 'http://corpproxy.com/';
    test.equal(getProxy(config()), undefined);
    process.env.http_proxy = 'http://other-proxy.com/';
    test.equal(getProxy(config()).host, 'other-proxy.com');
    test.equal(getProxy(config({url: 'https://google.com/'})).host, 'corpproxy.com');
    delete process.env.https_proxy;
    test.equal(getProxy(config({url: 'https://google.com/'})), undefined);
    test.done();
  },

  canHandleCasingInProxyEnv: function(test) {
    process.env.HTTPS_PROXY = 'http://corpproxy.com/';
    test.equal(getProxy(config()), undefined);
    process.env.HTTP_PROXY = 'http://other-proxy.com/';
    test.equal(getProxy(config()).host, 'other-proxy.com');
    test.equal(getProxy(config({url: 'https://google.com/'})).host, 'corpproxy.com');
    delete process.env.HTTPS_PROXY;
    test.equal(getProxy(config({url: 'https://google.com/'})), undefined);
    test.done();
  },

  canHandleNoProxy: function(test) {
    process.env.HTTPS_PROXY = 'http://corpproxy.com/';
    process.env.NO_PROXY = 'google.com';
    test.equal(getProxy(config({url: 'https://google.com'})), undefined);
    test.equal(getProxy(config({url: 'https://google.com/page.php'})), undefined);
    test.done();
  },

  canHandleNoNoProxy: function(test) {
    process.env.HTTPS_PROXY = 'http://cc.com/';
    process.env.NO_PROXY = 'google.com';
    test.equal(getProxy(config({url: 'https://sbb.com'})).host, 'cc.com');
    test.equal(getProxy(config({url: 'https://www.google.com/page.php'})).host, 'cc.com');
    test.done();
  },

  canHandleMultipleNoProxy: function(test) {
    process.env.HTTPS_PROXY = 'http://corpproxy.com/';
    process.env.NO_PROXY = 'google.com, .amazon.de nzz.ch ';
    test.equal(getProxy(config({url: 'https://google.com'})), undefined);
    test.equal(getProxy(config({url: 'https://www.amazon.de/index.html'})), undefined);
    test.equal(getProxy(config({url: 'https://nzz.ch/index.html'})), undefined);
    test.done();
  },

  canHandlePortsInNoProxy: function(test) {
    process.env.HTTPS_PROXY = 'http://cc.com/';
    process.env.NO_PROXY = '*google.com:8080';
    test.equal(getProxy(config({url: 'https://www2.google.com:8080/index.html'})), undefined);
    test.equal(getProxy(config({url: 'https://google.com/index.html'})).host, 'cc.com');
    test.equal(getProxy(config({url: 'https://nzz.ch/index.html'})).host, 'cc.com');
    test.done();
  },

  canHandleStarInNoProxy: function(test) {
    process.env.HTTPS_PROXY = 'http://cc.com/';
    process.env.NO_PROXY = '*';
    test.equal(getProxy(config({url: 'https://www2.google.com:8080/index.html'})), undefined);
    test.equal(getProxy(config({url: 'https://google.com/index.html'})), undefined);
    test.equal(getProxy(config({url: 'https://nzz.ch/index.html'})), undefined);
    test.done();
  },

  testIsANoProxyHost: function(test) {
    process.env.HTTPS_PROXY = 'http://cc.com/';
    [
      {h: 'bliss.mit.edu', no_p: undefined, res: false},
      {h: 'bliss.mit.edu', no_p: 'localhost', res: false},
      {h: 'bliss.mit.edu', no_p: 'localhost, my.corp.com', res: false},
      {h: 'bliss.mit.edu', no_p: '.mit.edu', res: true},
      {h: 'bliss.mit.edu', no_p: '.mit.edu,localhost', res: true},
      {h: 'bliss.mit.edu', no_p: ' .mit.edu', res: true},
      {h: 'bliss.mit.edu', no_p: '.mit.edu ', res: true},
      {h: 'bliss.mit.edu', no_p: 'localhost, .mit.edu', res: true},
      {h: 'bliss.mit.edu', no_p: '.edu', res: true},
      {h: '127.0.0.1', no_p: '.0.0.1', res: true},
      {h: '127.0.0.1', no_p: 'localhost', res: false}
    ].forEach(function(data) {
      process.env.no_proxy = data.no_p;
      var proxy = getProxy(config({url: 'https://' + data.h + '/index.html'}));
      if (data.res) {
        test.equal(proxy, undefined);
      } else {
        test.equal(proxy.host, 'cc.com');
      }
      delete process.env.no_proxy;

      process.env.NO_PROXY = data.no_p;
      var proxy2 = getProxy(config({url: 'https://' + data.h + '/index.html'}));
      if (data.res) {
        test.equal(proxy2, undefined);
      } else {
        test.equal(proxy2.host, 'cc.com');
      }
      delete process.env.NO_PROXY;
    });

    test.done();
  }
};

