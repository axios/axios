import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import dispatchRequest from '../../../lib/core/dispatchRequest.js';
import transformData from '../../../lib/core/transformData.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import CancelToken from '../../../lib/cancel/CancelToken.js';

const makeResponse = (config) => ({
  data: 'ok',
  headers: {},
  status: 200,
  statusText: 'OK',
  config,
  request: {},
});

const makeConfig = (overrides = {}) => ({
  method: 'post',
  url: '/test',
  headers: {},
  data: 'input',
  transformRequest: [],
  transformResponse: [(data) => data],
  adapter: (config) => Promise.resolve(makeResponse(config)),
  ...overrides,
});

describe('async request transformers', () => {
  it('awaits each transformation and updated headers before calling the adapter', async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const calls = [];
    const config = makeConfig({
      transformRequest: [
        async (data, headers) => {
          calls.push('first');
          await gate;
          headers.set('X-Signature', 'signed');
          return data + '-async';
        },
        (data, headers) => {
          calls.push('second');
          assert.equal(data, 'input-async');
          assert.equal(headers.get('X-Signature'), 'signed');
          return data + '-sync';
        },
      ],
      adapter: (config) => {
        calls.push('adapter');
        assert.equal(config.data, 'input-async-sync');
        assert.equal(config.headers.get('X-Signature'), 'signed');
        return Promise.resolve(makeResponse(config));
      },
    });

    const pending = dispatchRequest(config);
    assert.deepEqual(calls, ['first'], 'adapter must not run while transformation is pending');
    release();
    const result = await pending;

    assert.equal(result.data, 'ok');
    assert.deepEqual(calls, ['first', 'second', 'adapter']);
  });

  it('does not call the adapter when an asynchronous transformer rejects', async () => {
    const failure = new Error('signature service unavailable');
    let adapterCalled = false;
    const pending = dispatchRequest(makeConfig({
      transformRequest: [() => Promise.reject(failure)],
      adapter: () => {
        adapterCalled = true;
        return Promise.resolve(makeResponse({}));
      },
    }));

    await assert.rejects(pending, (error) => error === failure);
    assert.equal(adapterCalled, false);
  });

  it('checks cancellation again after an asynchronous transformer resolves', async () => {
    const controller = new AbortController();
    let complete;
    let adapterCalled = false;
    const pending = dispatchRequest(makeConfig({
      signal: controller.signal,
      transformRequest: [() => new Promise((resolve) => { complete = resolve; })],
      adapter: () => {
        adapterCalled = true;
        return Promise.resolve(makeResponse({}));
      },
    }));

    controller.abort();
    complete('finished');

    await assert.rejects(pending, (error) => error.code === AxiosError.ERR_CANCELED);
    assert.equal(adapterCalled, false);
  });

  it('still calls the adapter synchronously for synchronous transformations', async () => {
    let called = false;
    const pending = dispatchRequest(makeConfig({
      transformRequest: [(data) => data + '-sync'],
      adapter: (config) => {
        called = true;
        assert.equal(config.data, 'input-sync');
        return Promise.resolve(makeResponse(config));
      },
    }));

    assert.equal(called, true, 'synchronous transforms must not add a microtask delay');
    await pending;
  });


  it('rejects immediately if the signal aborts while a transformer never settles', async () => {
    const controller = new AbortController();
    let adapterCalled = false;
    const pending = dispatchRequest(makeConfig({
      signal: controller.signal,
      transformRequest: [() => new Promise(() => {})],
      adapter: () => {
        adapterCalled = true;
        return Promise.resolve(makeResponse({}));
      },
    }));

    // A timeout makes a regression fail rather than leave the test runner hanging.
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('cancellation stayed pending')), 250);
    });

    try {
      controller.abort();
      await assert.rejects(Promise.race([pending, timeout]), (error) => {
        return error.code === AxiosError.ERR_CANCELED;
      });
      assert.equal(adapterCalled, false);
    } finally {
      clearTimeout(timer);
    }
  });

  it('supports CancelToken cancellation while a transformer is still pending', async () => {
    const source = CancelToken.source();
    let resolveTransform;
    let adapterCalled = false;
    const pending = dispatchRequest(makeConfig({
      cancelToken: source.token,
      transformRequest: [() => new Promise((resolve) => { resolveTransform = resolve; })],
      adapter: () => {
        adapterCalled = true;
        return Promise.resolve(makeResponse({}));
      },
    }));

    source.cancel('canceled during transform');
    await assert.rejects(pending, (error) => {
      return error.code === AxiosError.ERR_CANCELED && error.message === 'canceled during transform';
    });

    // Resolving after cancellation must not dispatch the adapter.
    resolveTransform('too late');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(adapterCalled, false);
  });

  it('unsubscribes from CancelToken after an async transformation succeeds', async () => {
    const source = CancelToken.source();
    const result = await dispatchRequest(makeConfig({
      cancelToken: source.token,
      transformRequest: [async (data) => data + '-done'],
    }));

    assert.equal(result.data, 'ok');
    assert.equal(source.token._listeners?.length || 0, 0);
  });

  it('leaves response transformations synchronous even if they return a Promise', () => {
    const thenable = Promise.resolve('response');
    const transformed = transformData.call(
      { headers: {} },
      [() => thenable],
      { data: 'response', headers: {}, status: 200 }
    );

    assert.equal(transformed, thenable);
  });
});
