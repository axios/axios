'use strict';

var assert = require('assert');
var axios = require('../../../index');
var AxiosError = require('../../../lib/core/AxiosError');

describe('synchronous request interceptor chain', function () {
  function stubAdapter(store) {
    return function adapter(config) {
      store.calls++;

      return Promise.resolve({
        data: '',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config,
        request: {}
      });
    };
  }

  it('runs the response interceptors when dispatch fails synchronously', function () {
    var store = {calls: 0};
    var source = axios.CancelToken.source();
    var instance = axios.create({adapter: stubAdapter(store)});
    var rejectedRan = false;
    var fulfilledRan = false;

    source.cancel('canceled before the request');

    instance.interceptors.response.use(
      function (response) {
        fulfilledRan = true;
        return response;
      },
      function (error) {
        rejectedRan = true;
        return Promise.reject(error);
      }
    );

    return instance.get('/foo', {cancelToken: source.token}).then(
      function () {
        throw new Error('should have rejected');
      },
      function (error) {
        assert.strictEqual(error.code, AxiosError.ERR_CANCELED);
        assert.strictEqual(rejectedRan, true, 'the rejection interceptor should run');
        assert.strictEqual(fulfilledRan, false);
        assert.strictEqual(store.calls, 0, 'the request should not be dispatched');
      }
    );
  });

  it('runs the response interceptors when the signal is already aborted', function () {
    if (typeof AbortController === 'undefined') {
      this.skip();
      return;
    }

    var store = {calls: 0};
    var controller = new AbortController();
    var instance = axios.create({adapter: stubAdapter(store)});
    var rejectedRan = false;

    controller.abort();

    instance.interceptors.response.use(undefined, function (error) {
      rejectedRan = true;
      return Promise.reject(error);
    });

    return instance.get('/foo', {signal: controller.signal}).then(
      function () {
        throw new Error('should have rejected');
      },
      function (error) {
        assert.strictEqual(error.code, AxiosError.ERR_CANCELED);
        assert.strictEqual(rejectedRan, true, 'the rejection interceptor should run');
        assert.strictEqual(store.calls, 0, 'the request should not be dispatched');
      }
    );
  });

  it('rejects instead of throwing when a throwing interceptor has no rejection handler', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});

    instance.interceptors.request.use(
      function () {
        throw new Error('boom');
      },
      undefined,
      {synchronous: true}
    );

    var promise = instance.get('/foo');

    assert.ok(promise instanceof Promise);

    return promise.then(
      function () {
        throw new Error('should have rejected');
      },
      function (error) {
        assert.strictEqual(error.message, 'boom');
        assert.strictEqual(store.calls, 0, 'the request should not be dispatched');
      }
    );
  });

  it('honours a rejection handler that returns a rejected promise', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});

    instance.interceptors.request.use(
      function () {
        throw new Error('boom');
      },
      function (error) {
        return Promise.reject(error);
      },
      {synchronous: true}
    );

    return instance.get('/foo').then(
      function () {
        throw new Error('should have rejected');
      },
      function (error) {
        assert.strictEqual(error.message, 'boom');
        assert.strictEqual(store.calls, 0, 'the request should not be dispatched');
      }
    );
  });

  it('waits for a rejection handler that recovers asynchronously', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});
    var recovered = false;

    instance.interceptors.request.use(
      function () {
        throw new Error('boom');
      },
      function () {
        assert.strictEqual(this, undefined, 'rejection handlers retain their unbound context');
        return new Promise(function (resolve) {
          setTimeout(function () {
            recovered = true;
            resolve();
          }, 10);
        });
      },
      {synchronous: true}
    );

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(recovered, true, 'the request should wait for the recovery');
      assert.strictEqual(store.calls, 1);
    });
  });

  it('rejects when a rejection handler throws', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});

    instance.interceptors.request.use(
      function () {
        throw new Error('boom');
      },
      function () {
        throw new Error('rethrown');
      },
      {synchronous: true}
    );

    return instance.get('/foo').then(
      function () {
        throw new Error('should have rejected');
      },
      function (error) {
        assert.strictEqual(error.message, 'rethrown');
        assert.strictEqual(store.calls, 0, 'the request should not be dispatched');
      }
    );
  });

  it('keeps dispatching when an interceptor omits its fulfilled handler', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});

    instance.interceptors.request.use(
      undefined,
      function (error) {
        return Promise.reject(error);
      },
      {synchronous: true}
    );

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(store.calls, 1);
    });
  });

  it('does not invoke a rejection-only interceptor for a successful config', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});
    instance.interceptors.request.use(undefined, function () {
      throw new Error('rejection handler must not be called');
    }, {synchronous: true});
    var request = instance.get('/foo');
    assert.strictEqual(store.calls, 1, 'successful synchronous requests still dispatch immediately');
    return request;
  });

  it('lets response interceptors recover from a synchronous request failure in order', function () {
    var store = {calls: 0};
    var instance = axios.create({adapter: stubAdapter(store)});
    var error = new Error('original failure');
    var calls = [];
    instance.interceptors.request.use(function () { throw error; }, undefined, {synchronous: true});
    instance.interceptors.response.use(undefined, function (reason) {
      assert.strictEqual(reason, error);
      calls.push('rejected');
      return 'recovered';
    });
    instance.interceptors.response.use(function (result) {
      calls.push('fulfilled');
      return result + '!';
    });
    return instance.get('/foo').then(function (result) {
      assert.strictEqual(result, 'recovered!');
      assert.deepStrictEqual(calls, ['rejected', 'fulfilled']);
      assert.strictEqual(store.calls, 0);
    });
  });
});
