import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import dispatchRequest from '../../../lib/core/dispatchRequest.js';
import transformData from '../../../lib/core/transformData.js';
import AxiosError from '../../../lib/core/AxiosError.js';

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
