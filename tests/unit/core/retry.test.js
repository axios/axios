import assert from 'assert';
import { Readable } from 'stream';
import { describe, it } from 'vitest';
import axios from '../../../lib/axios.js';

import {
  attachRetry,
  calculateRetryDelay,
  isRetryableError,
  parseRetryAfter,
} from '../../../lib/core/retry.js';

describe('helpers:retry', function () {
  describe('parseRetryAfter', function () {
    it('should parse integer seconds correctly', function () {
      const res = { headers: { 'retry-after': '5' } };
      assert.strictEqual(parseRetryAfter(res), 5000);
    });

    it('should return null when header is missing', function () {
      assert.strictEqual(parseRetryAfter({ headers: {} }), null);
      assert.strictEqual(parseRetryAfter(null), null);
    });

    it('should parse HTTP-date format', function () {
      const futureDate = new Date(Date.now() + 10000).toUTCString();
      const res = { headers: { 'retry-after': futureDate } };
      const delay = parseRetryAfter(res);
      assert(delay > 0 && delay <= 10000);
    });
  });

  describe('calculateRetryDelay', function () {
    it('should compute exponential backoff', function () {
      const delay0 = calculateRetryDelay(0, { retryDelay: 100, backoffFactor: 2, jitter: false });
      const delay1 = calculateRetryDelay(1, { retryDelay: 100, backoffFactor: 2, jitter: false });
      const delay2 = calculateRetryDelay(2, { retryDelay: 100, backoffFactor: 2, jitter: false });

      assert.strictEqual(delay0, 100);
      assert.strictEqual(delay1, 200);
      assert.strictEqual(delay2, 400);
    });

    it('should respect maxDelay cap', function () {
      const delay = calculateRetryDelay(10, { retryDelay: 1000, backoffFactor: 2, maxDelay: 5000, jitter: false });
      assert.strictEqual(delay, 5000);
    });

    it('should respect Retry-After header on response', function () {
      const res = { headers: { 'retry-after': '3' } };
      const delay = calculateRetryDelay(0, { respectRetryAfter: true }, res);
      assert.strictEqual(delay, 3000);
    });

    it('should call custom retryDelay function if provided', function () {
      const customFn = (retryCount) => (retryCount + 1) * 50;
      const delay = calculateRetryDelay(2, { retryDelay: customFn });
      assert.strictEqual(delay, 150);
    });

    it('should cap a custom retryDelay at maxDelay', function () {
      assert.strictEqual(calculateRetryDelay(0, { retryDelay: () => 100000, maxDelay: 5000 }), 5000);
    });
  });

  describe('isRetryableError', function () {
    it('should identify 5xx and 429 status as retryable for GET', function () {
      const err503 = { config: { method: 'get' }, response: { status: 503 } };
      const err429 = { config: { method: 'get' }, response: { status: 429 } };
      const err404 = { config: { method: 'get' }, response: { status: 404 } };

      assert.strictEqual(isRetryableError(err503), true);
      assert.strictEqual(isRetryableError(err429), true);
      assert.strictEqual(isRetryableError(err404), false);
    });

    it('should not retry POST by default', function () {
      const err500 = { config: { method: 'post' }, response: { status: 500 } };
      assert.strictEqual(isRetryableError(err500), false);
    });

    it('should retry the supported QUERY method by default', function () {
      assert.strictEqual(isRetryableError({ config: { method: 'query' }, response: { status: 503 } }), true);
    });

    it('should not retry when the request method is inherited', function () {
      const config = Object.create({ method: 'post' });
      const err500 = { config, response: { status: 500 } };
      assert.strictEqual(isRetryableError(err500), false);
    });

    it('should retry network errors with no response', function () {
      const netErr = { config: { method: 'get' }, request: {}, code: 'ECONNRESET' };
      assert.strictEqual(isRetryableError(netErr), true);
    });

    it('should not retry canceled errors', function () {
      const cancelErr = { __CANCEL__: true, config: { method: 'get' } };
      assert.strictEqual(isRetryableError(cancelErr), false);
    });
  });

  describe('attachRetry interceptor integration', function () {
    it('should replace the prior retry interceptor when attached again', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 2 });
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 0 });
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const error = new Error('Service Unavailable');
        error.config = config;
        error.response = { status: 503, headers: {} };
        throw error;
      };

      await assert.rejects(instance.get('http://test.local'));
      assert.strictEqual(attempts, 1);
    });

    it('should not transform an already-transformed request body again on retry', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });
      let transforms = 0;
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        assert.strictEqual(config.data, 'payload!');
        if (attempts === 1) {
          const error = new Error('Service Unavailable');
          error.config = config;
          error.response = { status: 503, headers: {} };
          throw error;
        }
        return { data: 'success', status: 200, headers: {}, config };
      };

      const response = await instance.put('http://test.local', 'payload', {
        transformRequest: [(data) => {
          transforms++;
          return `${data}!`;
        }],
      });
      assert.strictEqual(response.data, 'success');
      assert.strictEqual(attempts, 2);
      assert.strictEqual(transforms, 1);
    });

    it('should use finite default retries for an invalid retry count', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: Infinity });
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const error = new Error('Service Unavailable');
        error.config = config;
        error.response = { status: 503, headers: {} };
        throw error;
      };

      await assert.rejects(instance.get('http://test.local'));
      assert.strictEqual(attempts, 4);
    });

    it('should preserve an adapter rejection that refuses method metadata', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });
      let rejectedError;
      instance.defaults.adapter = async (config) => {
        const error = new Error('Adapter failed');
        error.config = config;
        rejectedError = new Proxy(error, {
          set(target, key, value) {
            if (typeof key === 'symbol') {
              throw new TypeError('Metadata refused');
            }
            return Reflect.set(target, key, value);
          },
        });
        throw rejectedError;
      };

      await assert.rejects(instance.post('http://test.local'), (error) => error === rejectedError);
    });

    it('should retry a GET when a custom adapter omits method from the error config', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('Service Unavailable');
          error.config = { ...config };
          delete error.config.method;
          error.response = { status: 503, headers: {} };
          throw error;
        }
        return { data: 'success', status: 200, headers: {}, config };
      };

      const response = await instance.get('http://test.local');
      assert.strictEqual(response.data, 'success');
      assert.strictEqual(attempts, 2);
    });

    it('should retry a dispatched GET despite an inherited method on the error config', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('Service Unavailable');
          error.config = Object.assign(Object.create({ method: 'post' }), config);
          delete error.config.method;
          error.response = { status: 503, headers: {} };
          throw error;
        }
        return { data: 'success', status: 200, headers: {}, config };
      };

      const response = await instance.get('http://test.local');
      assert.strictEqual(response.data, 'success');
      assert.strictEqual(attempts, 2);
    });

    it('should not retry a POST produced by a later request interceptor', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });
      instance.interceptors.request.use((config) => ({ ...config, method: 'post' }));
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const error = new Error('Service Unavailable');
        error.config = { ...config };
        delete error.config.method;
        error.response = { status: 503, headers: {} };
        throw error;
      };

      await assert.rejects(instance.get('http://test.local'), (error) => error.response.status === 503);
      assert.strictEqual(attempts, 1);
    });

    it('should not retry an error whose config inherits its request method', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const errorConfig = Object.create({ method: 'post' });
        Object.assign(errorConfig, config);
        delete errorConfig.method;

        const error = new Error('Service Unavailable');
        error.config = errorConfig;
        error.response = { status: 503, headers: {} };
        throw error;
      };

      await assert.rejects(instance.post('http://test.local'), (error) => error.response.status === 503);
      assert.strictEqual(attempts, 1);
    });

    it('should ignore inherited request data when checking body replayability', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        if (attempts === 1) {
          const errorConfig = Object.create({ data: Readable.from(['inherited']) });
          Object.assign(errorConfig, config);
          delete errorConfig.data;

          const error = new Error('Service Unavailable');
          error.config = errorConfig;
          error.response = { status: 503, headers: {} };
          throw error;
        }

        return { data: 'success', status: 200, headers: {}, config };
      };

      const response = await instance.get('http://test.local');

      assert.strictEqual(response.data, 'success');
      assert.strictEqual(attempts, 2);
    });

    it('should ignore an inherited retry setting', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        if (attempts === 1) {
          const errorConfig = Object.create({ retry: false });
          Object.assign(errorConfig, config);
          delete errorConfig.retry;

          const error = new Error('Service Unavailable');
          error.config = errorConfig;
          error.response = { status: 503, headers: {} };
          throw error;
        }

        return { data: 'success', status: 200, headers: {}, config };
      };

      const response = await instance.get('http://test.local');

      assert.strictEqual(response.data, 'success');
      assert.strictEqual(attempts, 2);
    });

    it('should retry failed requests and succeed when subsequent attempt passes', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 10, jitter: false });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        if (attempts < 3) {
          const err = new Error('Request failed with status code 503');
          err.config = config;
          err.response = { status: 503, headers: {} };
          throw err;
        }
        return { data: 'success', status: 200, headers: {}, config };
      };

      const retriesLogged = [];
      const res = await instance.get('http://test.local', {
        retry: {
          retries: 3,
          onRetry: (count, err, cfg, delay) => {
            retriesLogged.push(count);
          },
        },
      });

      assert.strictEqual(res.data, 'success');
      assert.strictEqual(attempts, 3);
      assert.deepStrictEqual(retriesLogged, [1, 2]);
    });

    it('should reject when retries are exhausted', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 10, jitter: false, retries: 2 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const err = new Error('Service Unavailable');
        err.config = config;
        err.response = { status: 503, headers: {} };
        throw err;
      };

      try {
        await instance.get('http://test.local');
        assert.fail('Should have failed');
      } catch (err) {
        assert.strictEqual(err.response.status, 503);
        assert.strictEqual(attempts, 3); // initial + 2 retries
      }
    });

    it('should not retry if config.retry is false', async function () {
      const instance = axios.create();
      attachRetry(instance, { retries: 3 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const err = new Error('Internal Server Error');
        err.config = config;
        err.response = { status: 500, headers: {} };
        throw err;
      };

      try {
        await instance.get('http://test.local', { retry: false });
        assert.fail('Should have failed');
      } catch (err) {
        assert.strictEqual(attempts, 1);
      }
    });

    it('should not retry non-replayable stream bodies', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 10, jitter: false, retries: 3 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const err = new Error('Service Unavailable');
        err.config = config;
        err.response = { status: 503, headers: {} };
        throw err;
      };

      try {
        await instance.put('http://test.local', Readable.from(['payload']), {
          retry: { retries: 3 },
        });
        assert.fail('Should have failed');
      } catch (err) {
        assert.strictEqual(attempts, 1);
        assert.strictEqual(err.response.status, 503);
      }
    });

    it('should ignore inherited cancellation settings during backoff', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 0, jitter: false, retries: 1 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        if (attempts === 1) {
          const inheritedSignal = new AbortController();
          inheritedSignal.abort();
          const errorConfig = Object.create({ signal: inheritedSignal.signal, cancelToken: { reason: true } });
          Object.assign(errorConfig, config);
          delete errorConfig.signal;
          delete errorConfig.cancelToken;

          const error = new Error('Service Unavailable');
          error.config = errorConfig;
          error.response = { status: 503, headers: {} };
          throw error;
        }

        return { data: 'success', status: 200, headers: {}, config };
      };

      const response = await instance.get('http://test.local');

      assert.strictEqual(response.data, 'success');
      assert.strictEqual(attempts, 2);
    });

    it('should stop waiting when aborted during backoff', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 250, jitter: false, retries: 1 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const err = new Error('Service Unavailable');
        err.config = config;
        err.response = { status: 503, headers: {} };
        throw err;
      };

      const controller = new AbortController();
      const startedAt = Date.now();
      const request = instance.get('http://test.local', {
        signal: controller.signal,
        retry: { retries: 1, retryDelay: 250, jitter: false },
      });

      setTimeout(() => controller.abort(), 25);

      try {
        await request;
        assert.fail('Should have failed');
      } catch (err) {
        const elapsed = Date.now() - startedAt;

        assert.strictEqual(attempts, 1);
        assert.strictEqual(err.code, 'ERR_CANCELED');
        assert(elapsed < 200);
      }
    });
    it('should preserve an AxiosError abort reason during backoff', async function () {
      const instance = axios.create();
      attachRetry(instance, { retryDelay: 250, jitter: false, retries: 1 });

      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const err = new Error('Service Unavailable');
        err.config = config;
        err.response = { status: 503, headers: {} };
        throw err;
      };

      const controller = new AbortController();
      const abortReason = new axios.AxiosError('abort reason', 'E_ABORT_REASON', null, null, {
        status: 418,
        headers: { 'x-reason-metadata': 'preserved' },
      });
      const request = instance.get('http://test.local', {
        signal: controller.signal,
        retry: { retries: 1, retryDelay: 250, jitter: false },
      });

      setTimeout(() => controller.abort(abortReason), 25);

      try {
        await request;
        assert.fail('Should have failed');
      } catch (err) {
        assert.strictEqual(attempts, 1);
        assert.strictEqual(err, abortReason);
        assert.strictEqual(err.response.status, 418);
        assert.strictEqual(err.response.headers['x-reason-metadata'], 'preserved');
      }
    });

    it.each([
      ['an Error', new Error('plain abort reason'), 'plain abort reason'],
      ['a string', 'string abort reason', 'string abort reason'],
    ])('should preserve %s abort reasons during backoff', async (_label, abortReason, expectedMessage) => {
      const instance = axios.create();
      attachRetry(instance, {retryDelay: 250, jitter: false, retries: 1});
      let attempts = 0;
      instance.defaults.adapter = async (config) => {
        attempts++;
        const error = new Error('Service Unavailable');
        error.config = config;
        error.response = {status: 503, headers: {}};
        throw error;
      };

      const controller = new AbortController();
      const request = instance.get('http://test.local', {
        signal: controller.signal,
        retry: {retries: 1, retryDelay: 250, jitter: false},
      });
      setTimeout(() => controller.abort(abortReason), 25);

      await assert.rejects(request, (error) => {
        assert.strictEqual(attempts, 1);
        assert.strictEqual(error.code, 'ERR_CANCELED');
        assert.strictEqual(error.message, expectedMessage);
        return true;
      });
    });
  });
});
