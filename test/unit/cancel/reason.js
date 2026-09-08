'use strict';

var assert = require('assert');
var http = require('http');
var axios = require('../../../index');
var fromSignal = require('../../../lib/cancel/fromSignal');
var PolyfillAbortController = require('abortcontroller-polyfill/dist/cjs-ponyfill.js').AbortController;
var AbortController = global.AbortController || PolyfillAbortController;

function abort(controller, reason) {
  // The pinned ponyfill predates signal.reason. Model that optional property
  // on Node 12 while using the native implementation on newer runtimes.
  if (!('reason' in controller.signal)) {
    Object.defineProperty(controller.signal, 'reason', {value: reason});
  }
  controller.abort(reason);
}

function wrapSignal(signal) {
  return {
    get aborted() { return signal.aborted; },
    get reason() { return signal.reason; },
    onabort: null,
    addEventListener: function () { return signal.addEventListener.apply(signal, arguments); },
    removeEventListener: function () { return signal.removeEventListener.apply(signal, arguments); }
  };
}

describe('AbortSignal cancellation reasons', function () {
  var reasons = [new Error('timeout'), 'superseded', {operation: 'search'}, null, false, 0, ''];

  function rejectionOf(promise) {
    return promise.then(function () { throw new Error('expected cancellation'); }, function (error) { return error; });
  }

  function assertCancellation(error, reason) {
    assert(axios.isCancel(error));
    assert.strictEqual(error.name, 'CanceledError');
    assert.strictEqual(error.code, 'ERR_CANCELED');
    assert.strictEqual(error.message, 'canceled');
    assert.strictEqual(error.reason, reason);
  }

  reasons.forEach(function (reason, index) {
    it('preserves pre-aborted reason ' + index + ' by identity', function () {
      var controller = new AbortController();
      abort(controller, reason);
      return rejectionOf(axios.get('/unused', {signal: controller.signal})).then(function (error) {
        assertCancellation(error, reason);
        assert.strictEqual(error.config.signal, controller.signal);
      });
    });
  });

  it('keeps cancellation working for legacy signals and throwing reason getters', function () {
    var legacy = {aborted: true};
    var throwing = {};
    Object.defineProperty(throwing, 'reason', {get: function () { throw new Error('custom getter'); }});
    [legacy, throwing].forEach(function (signal) {
      var error = fromSignal(signal);
      assertCancellation(error, undefined);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(error, 'reason'), false);
    });
  });

  it('preserves reason identity with the Node 12-compatible ponyfill', function () {
    var controller = new PolyfillAbortController();
    var reason = {operation: 'superseded'};
    abort(controller, reason);
    return rejectionOf(axios.get('/unused', {signal: controller.signal})).then(function (error) {
      assertCancellation(error, reason);
      assert.strictEqual(error.config.signal, controller.signal);
    });
  });

  it('preserves a structural signal and circular reason in instance defaults', function () {
    var reason = {};
    reason.self = reason;
    var signal = {
      aborted: true,
      reason: reason,
      onabort: null,
      addEventListener: function () {},
      removeEventListener: function () {}
    };
    var instance = axios.create({signal: signal});
    assert.strictEqual(instance.defaults.signal, signal);
    return rejectionOf(instance.get('/unused')).then(function (error) {
      assertCancellation(error, reason);
      assert.strictEqual(error.config.signal, signal);
    });
  });

  it('cancels a structural signal with a throwing reason getter through the request API', function () {
    var signal = {
      aborted: true,
      get reason() { throw new Error('custom getter'); },
      onabort: null,
      addEventListener: function () {},
      removeEventListener: function () {}
    };
    return rejectionOf(axios.get('/unused', {signal: signal})).then(function (error) {
      assertCancellation(error, undefined);
      assert.strictEqual(error.config.signal, signal);
    });
  });

  it('does not read a structural signal reason before cancellation', function () {
    var reads = 0;
    var signal = {
      aborted: false,
      get reason() { reads++; throw new Error('reason must not be read'); },
      onabort: null,
      addEventListener: function () {},
      removeEventListener: function () {}
    };
    var instance = axios.create({signal: signal, adapter: function (config) {
      return Promise.resolve({data: 'ok', status: 200, statusText: 'OK', headers: {}, config: config});
    }});
    return instance.get('/unused').then(function (response) {
      assert.strictEqual(response.config.signal, signal);
      assert.strictEqual(reads, 0);
    });
  });

  it('retains the CancelToken error and its message when both cancellation APIs are configured', function () {
    var controller = new AbortController();
    var source = axios.CancelToken.source();
    abort(controller, 'signal reason');
    source.cancel('token reason');
    return rejectionOf(axios.get('/unused', {signal: controller.signal, cancelToken: source.token})).then(function (error) {
      assert.strictEqual(error, source.token.reason);
      assert.strictEqual(error.message, 'token reason');
      assert.strictEqual(error.reason, undefined);
    });
  });

  [false, true].forEach(function (structural) {
    it('preserves in-flight HTTP reasons and listener cleanup with a ' + (structural ? 'structural' : 'controller') + ' signal', function () {
      var server;
      var sockets = [];
      var controller = new AbortController();
      var reason = new Error('operation timed out');
      var removed = 0;
      var originalRemove = controller.signal.removeEventListener;
      controller.signal.removeEventListener = function (event, callback) {
        if (event === 'abort') removed++;
        return originalRemove.call(this, event, callback);
      };
      var signal = structural ? wrapSignal(controller.signal) : controller.signal;
      return new Promise(function (resolve, reject) {
        server = http.createServer(function () { abort(controller, reason); });
        server.on('connection', function (socket) { sockets.push(socket); });
        server.on('error', reject);
        server.listen(0, '127.0.0.1', function () {
          rejectionOf(axios.get('http://127.0.0.1:' + server.address().port, {signal: signal, proxy: false})).then(resolve, reject);
        });
      }).then(function (error) {
        assertCancellation(error, reason);
        assert.strictEqual(error.config.signal, signal);
        assert(error.request);
        assert(removed > 0);
      }).finally(function () {
        sockets.forEach(function (socket) { socket.destroy(); });
        if (server) return new Promise(function (resolve) { server.close(resolve); });
      });
    });
  });
});
