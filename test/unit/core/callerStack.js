'use strict';

var assert = require('assert');
var axios = require('../../../index');
var AxiosError = require('../../../lib/core/AxiosError');

describe('caller stack reconstruction', function () {
  var stacks;

  function rejectingAdapter(config) {
    return new Promise(function (resolve, reject) {
      // Reject from a later tick so the error is created with an adapter-only
      // stack, exactly like a real transport error.
      setTimeout(function () {
        var error = new AxiosError('boom', AxiosError.ERR_BAD_RESPONSE, config);

        if (config.dropStack) {
          error.stack = undefined;
        }

        stacks.original = error.stack;
        reject(error);
      }, 0);
    });
  }

  // Use request() for the shallow-stack regression: aliases have additional
  // synchronous wrapper frames that consume the runtime's stackTraceLimit.
  async function requestFromNamedCaller(instance, config) {
    return await instance.request(Object.assign({url: '/foo'}, config));
  }

  async function rejectionOf(promise) {
    var settled = false;

    try {
      await promise;
      settled = true;
    } catch (error) {
      return error;
    }

    assert.strictEqual(settled, false, 'the request should have rejected');
  }

  beforeEach(function () {
    stacks = {};
  });

  it('appends the caller stack to an error created inside an adapter', async function () {
    var instance = axios.create({adapter: rejectingAdapter});

    var error = await rejectionOf(requestFromNamedCaller(instance));

    assert.strictEqual(
      error.stack.indexOf(stacks.original),
      0,
      'the original stack should be kept as the prefix'
    );
    assert.notStrictEqual(
      error.stack.indexOf('requestFromNamedCaller'),
      -1,
      'the caller frame should be appended, got: ' + error.stack
    );
  });

  it('appends the caller stack when the reconstructed stack has fewer than three frames', async function () {
    // Regression guard for the sibling defect in the v1 implementation, where a
    // one or two frame caller stack was silently dropped (#11131).
    var instance = axios.create({adapter: rejectingAdapter});
    var originalLimit = Error.stackTraceLimit;

    Error.stackTraceLimit = 2;

    try {
      var error = await rejectionOf(requestFromNamedCaller(instance));

      assert.notStrictEqual(
        error.stack.indexOf('requestFromNamedCaller'),
        -1,
        'the caller frame should be appended, got: ' + error.stack
      );
    } finally {
      Error.stackTraceLimit = originalLimit;
    }
  });

  it('sets the stack when the rejected error has none', async function () {
    var instance = axios.create({adapter: rejectingAdapter});

    var error = await rejectionOf(requestFromNamedCaller(instance, {dropStack: true}));

    assert.strictEqual(stacks.original, undefined);
    assert.strictEqual(typeof error.stack, 'string');
    assert.notStrictEqual(error.stack.indexOf('requestFromNamedCaller'), -1);
  });

  it('keeps synchronous failures synchronous', function () {
    var instance = axios.create({adapter: rejectingAdapter});

    assert.throws(function () {
      instance.get('/foo', {transitional: {silentJSONParsing: 'not a boolean'}});
    }, /must be a boolean/);
  });

  it('preserves callers that use promises without async/await, including method aliases', function () {
    var instance = axios.create({adapter: rejectingAdapter});
    function promiseOnlyCaller() {
      return instance.get('/foo');
    }
    return rejectionOf(promiseOnlyCaller()).then(function (error) {
      assert.notStrictEqual(error.stack.indexOf('promiseOnlyCaller'), -1);
    });
  });

  it('also decorates failures after asynchronous request interceptors', function () {
    var instance = axios.create({adapter: rejectingAdapter});
    instance.interceptors.request.use(function (config) { return Promise.resolve(config); });
    return rejectionOf(requestFromNamedCaller(instance)).then(function (error) {
      assert.notStrictEqual(error.stack.indexOf('requestFromNamedCaller'), -1);
    });
  });

  it('does not replace non-Error rejections', function () {
    var reason = {message: 'application rejection'};
    var instance = axios.create({adapter: function () { return Promise.reject(reason); }});
    return rejectionOf(instance.get('/foo')).then(function (error) {
      assert.strictEqual(error, reason);
      assert.strictEqual(error.stack, undefined);
    });
  });

  it('does not replace errors with frozen stacks or throwing stack accessors', function () {
    var frozen = Object.freeze(new Error('frozen error'));
    var accessor = new Error('accessor error');
    Object.defineProperty(accessor, 'stack', {get: function () { throw new Error('stack hook'); }});
    return Promise.all([frozen, accessor].map(function (reason) {
      var instance = axios.create({adapter: function () { return Promise.reject(reason); }});
      return rejectionOf(instance.get('/foo')).then(function (error) { assert.strictEqual(error, reason); });
    }));
  });

  it('does not fail requests when stack capture throws', function () {
    var capture = Error.captureStackTrace;
    var failure = new Error('adapter failure');
    var instance = axios.create({adapter: function () { return Promise.reject(failure); }});
    var promise;
    Error.captureStackTrace = function () { throw new Error('capture hook'); };
    try {
      promise = instance.get('/foo');
    } finally {
      Error.captureStackTrace = capture;
    }
    return rejectionOf(promise).then(function (error) { assert.strictEqual(error, failure); });
  });

  it('leaves a resolved request untouched', function () {
    var instance = axios.create({
      adapter: function (config) {
        return Promise.resolve({
          data: 'ok',
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config,
          request: {}
        });
      }
    });

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.data, 'ok');
      assert.strictEqual(response.status, 200);
    });
  });
});
