import { describe, it, expect, vi } from 'vitest';
import axios from '../../../index.js';
import AxiosError, { CAUSED_BY_SEPARATOR } from '../../../lib/core/AxiosError.js';

describe('core::Axios', () => {
  it.each([1, 'true', 'false', null, {}])(
    'rejects non-boolean encodeBasicAuthUsername option %j before dispatch',
    async (value) => {
      const adapter = vi.fn();

      await expect(
        axios({
          url: '/foo',
          adapter,
          transitional: { encodeBasicAuthUsername: value },
        })
      ).rejects.toMatchObject({
        code: AxiosError.ERR_BAD_OPTION_VALUE,
      });
      expect(adapter).not.toHaveBeenCalled();
    }
  );

  describe('request error stack decoration', () => {
    async function expectAdapterFailurePreserved() {
      const failure = new Error('adapter failure');

      await expect(
        axios.request({
          url: 'http://localhost/test',
          adapter: () => Promise.reject(failure),
        })
      ).rejects.toBe(failure);
    }

    it('preserves the original error when Error.prepareStackTrace returns a non-string stack', async () => {
      const original = Error.prepareStackTrace;
      // Simulates instrumentation that overrides the V8 hook to return
      // structured call-site data instead of a formatted string.
      Error.prepareStackTrace = () => ({});

      try {
        await expectAdapterFailurePreserved();
      } finally {
        Error.prepareStackTrace = original;
      }
    });

    it('preserves the original error when Error.prepareStackTrace throws', async () => {
      const original = Error.prepareStackTrace;
      Error.prepareStackTrace = () => {
        throw new Error('stack formatting failure');
      };

      try {
        await expectAdapterFailurePreserved();
      } finally {
        Error.prepareStackTrace = original;
      }
    });

    it('preserves the original error when Error.captureStackTrace throws', async () => {
      const original = Error.captureStackTrace;
      Error.captureStackTrace = () => {
        throw new Error('stack capture failure');
      };

      try {
        await expectAdapterFailurePreserved();
      } finally {
        Error.captureStackTrace = original;
      }
    });

    const shortStacks = [
      ['one frame', '    at requestCaller (caller.js:1:1)'],
      ['two frames', '    at Axios.request (Axios.js:1:1)\n    at requestCaller (caller.js:1:1)'],
    ];

    it.each([
      ...shortStacks,
      [
        'three frames',
        '    at Axios.request (Axios.js:1:1)\n    at dispatch (caller.js:1:1)\n    at requestCaller (caller.js:2:1)',
      ],
    ])(
      'keeps %s of caller context ahead of the cause without duplicating it',
      async (_, callerStack) => {
        const cause = new Error('socket hang up');
        cause.stack = 'Error: socket hang up\n    at Socket.socketOnEnd (node:_http_client)';
        const failure = AxiosError.from(cause, 'ECONNRESET');
        const causeSection = CAUSED_BY_SEPARATOR + cause.stack;
        const initialStack = failure.stack;
        const causeIndex = initialStack.indexOf(CAUSED_BY_SEPARATOR);
        const original = Error.captureStackTrace;
        const rejections = [];

        Error.captureStackTrace = (target) => {
          target.stack = 'Error\n' + callerStack;
        };

        try {
          for (let i = 0; i < 2; i++) {
            rejections.push(
              await axios
                .request({ adapter: () => Promise.reject(failure) })
                .catch((error) => error)
            );
          }
        } finally {
          Error.captureStackTrace = original;
        }

        expect(rejections).toEqual([failure, failure]);
        expect(causeIndex).toBeGreaterThan(0);
        expect(failure.stack).toBe(
          initialStack.slice(0, causeIndex) + '\n' + callerStack + causeSection
        );
        expect(failure.cause).toBe(cause);
      }
    );

    it.each(['unwrapped', 'wrapped', 'nested', 'custom stack'])(
      'does not interpret marker text in a %s error as the appended cause',
      async (kind) => {
        const source = new Error('failure\nCaused by: message text');
        source.stack = 'Error: failure\nCaused by: message text\n    at source (source.js:1:1)';
        let failure = source;
        let causeSection = '';

        if (kind !== 'unwrapped') {
          if (kind === 'nested') {
            failure = AxiosError.from(failure);
          }
          causeSection = CAUSED_BY_SEPARATOR + failure.stack;
          failure = AxiosError.from(failure);
        }
        if (kind === 'custom stack') {
          failure = AxiosError.from(source, null, null, null, null, {
            stack: 'Custom failure\nCaused by: custom message\n    at custom (custom.js:1:1)',
          });
          causeSection = '';
        }

        const initialStack = failure.stack;
        const wrapperStack = initialStack.slice(0, initialStack.length - causeSection.length);
        const callerStack = '    at caller (caller.js:1:1)';
        const original = Error.captureStackTrace;
        let rejection;
        // The source may change after wrapping; preserve the captured section.
        if (kind !== 'unwrapped') {
          source.stack = 'changed source stack';
        }
        Error.captureStackTrace = (target) => {
          target.stack = 'Error\n' + callerStack;
        };

        try {
          rejection = await axios
            .request({ adapter: () => Promise.reject(failure) })
            .catch((error) => error);
        } finally {
          Error.captureStackTrace = original;
        }

        expect(rejection).toBe(failure);
        expect(failure.stack).toBe(wrapperStack + '\n' + callerStack + causeSection);
      }
    );

    it.each(shortStacks)('appends a reconstructed stack with %s', async (_, stack) => {
      const failure = new Error('adapter failure');
      const originalStack = 'Error: adapter failure\n    at adapterCallback (adapter.js:1:1)';
      failure.stack = originalStack;
      const original = Error.captureStackTrace;
      let rejection;

      Error.captureStackTrace = (target) => {
        target.stack = 'Error\n' + stack;
      };

      try {
        rejection = await axios
          .request({ adapter: () => Promise.reject(failure) })
          .catch((error) => error);
      } finally {
        Error.captureStackTrace = original;
      }

      expect(rejection).toBe(failure);
      expect(failure.stack).toBe(originalStack + '\n' + stack);
    });

    it.each(shortStacks)('does not duplicate an existing stack with %s', async (_, stack) => {
      const failure = new Error('adapter failure');
      const originalStack = 'Error: adapter failure\n' + stack;
      failure.stack = originalStack;
      const original = Error.captureStackTrace;
      let rejection;

      Error.captureStackTrace = (target) => {
        target.stack = 'Error\n' + stack;
      };

      try {
        rejection = await axios
          .request({ adapter: () => Promise.reject(failure) })
          .catch((error) => error);
      } finally {
        Error.captureStackTrace = original;
      }

      expect(rejection).toBe(failure);
      expect(failure.stack).toBe(originalStack);
    });

    it('preserves the caller when the reconstructed stack has two frames', async () => {
      const original = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;

      try {
        async function shortStackCaller() {
          await axios.request({
            url: 'http://localhost/test',
            adapter: () =>
              new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('adapter failure')), 0);
              }),
          });
        }

        await shortStackCaller().then(
          () => {
            throw new Error('expected request to reject');
          },
          (error) => {
            const matches = [...error.stack.matchAll(/shortStackCaller/g)];

            expect(matches).toHaveLength(1);
          }
        );
      } finally {
        Error.stackTraceLimit = original;
      }
    });
  });

  describe.each(['request', 'response'])('nullish %s interceptor handlers', (kind) => {
    it.each([null, undefined])('skips %s handlers and recovers on registration', async (value) => {
      const adapter = vi.fn(async (config) => ({
        data: 'ok',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));
      const instance = axios.create({ adapter });
      const removed = vi.fn((value) => value);
      const retained = vi.fn((value) => value);
      const manager = instance.interceptors[kind];

      manager.use(removed);
      instance.interceptors[kind === 'request' ? 'response' : 'request'].use(retained);
      manager.handlers = value;

      expect((await instance.get('http://localhost/test')).data).toBe('ok');
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(removed).not.toHaveBeenCalled();
      expect(retained).toHaveBeenCalledTimes(1);

      const recovered = vi.fn((value) => value);
      manager.use(recovered);

      expect((await instance.get('http://localhost/test')).data).toBe('ok');
      expect(adapter).toHaveBeenCalledTimes(2);
      expect(removed).not.toHaveBeenCalled();
      expect(retained).toHaveBeenCalledTimes(2);
      expect(recovered).toHaveBeenCalledTimes(1);
    });
  });

  it.each([false, true])(
    'ejects string IDs with synchronous request handlers: %s',
    async (synchronous) => {
      const instance = axios.create({
        adapter: async (config) => ({
          data: 'ok',
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      });
      const removedRequest = vi.fn((config) => config);
      const removedResponse = vi.fn((response) => response);
      const retainedRequest = vi.fn((config) => config);
      const retainedResponse = vi.fn((response) => response);
      const requestId = instance.interceptors.request.use(removedRequest, null, { synchronous });
      const responseId = instance.interceptors.response.use(removedResponse);

      instance.interceptors.request.use(retainedRequest, null, { synchronous });
      instance.interceptors.response.use(retainedResponse);
      instance.interceptors.request.eject(String(requestId));
      instance.interceptors.response.eject(String(responseId));

      expect((await instance.get('http://localhost/test')).data).toBe('ok');
      expect(removedRequest).not.toHaveBeenCalled();
      expect(removedResponse).not.toHaveBeenCalled();
      expect(retainedRequest).toHaveBeenCalledTimes(1);
      expect(retainedResponse).toHaveBeenCalledTimes(1);
    }
  );

  describe('synchronous request interceptor rejection thenables', () => {
    const createMockAdapter = () =>
      vi.fn(async (config) => ({
        data: 'sent',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));

    it.each([
      [
        'object thenable without catch',
        (reason, onAssimilated) => ({
          then(resolve, reject) {
            onAssimilated();
            reject(reason);
          },
        }),
      ],
      [
        'function thenable without catch',
        (reason, onAssimilated) =>
          Object.assign(() => {}, {
            then(resolve, reject) {
              onAssimilated();
              reject(reason);
            },
          }),
      ],
    ])(
      'assimilates a rejecting %s without dispatching the adapter',
      async (_, createRejectingThenable) => {
        const adapter = createMockAdapter();
        const instance = axios.create({ adapter });
        const recoveryError = new Error('rejected recovery');
        const skippedInterceptor = vi.fn((config) => config);
        const responseRejectedSpy = vi.fn((reason) => Promise.reject(reason));
        let assimilated = 0;

        // Request interceptors run LIFO by default; skippedInterceptor would run after the throw.
        instance.interceptors.request.use(skippedInterceptor, null, { synchronous: true });
        instance.interceptors.request.use(
          () => {
            throw new Error('interceptor failed');
          },
          () =>
            createRejectingThenable(recoveryError, () => {
              assimilated++;
            }),
          { synchronous: true }
        );
        instance.interceptors.response.use(null, responseRejectedSpy);

        await expect(instance.get('/test')).rejects.toBe(recoveryError);
        expect(assimilated).toBe(1);
        expect(adapter).not.toHaveBeenCalled();
        expect(skippedInterceptor).not.toHaveBeenCalled();
        expect(responseRejectedSpy).toHaveBeenCalledWith(recoveryError);
      }
    );

    it('waits for a pending thenable without catch and dispatches with the last valid config', async () => {
      const adapter = createMockAdapter();
      const instance = axios.create({ adapter });
      const skippedInterceptor = vi.fn((config) => config);
      let resolveThenable;
      let assimilated = 0;

      // LIFO order: header setter runs first, throwing interceptor runs second, skippedInterceptor would run third.
      instance.interceptors.request.use(skippedInterceptor, null, { synchronous: true });
      instance.interceptors.request.use(
        () => {
          throw new Error('interceptor failed');
        },
        () => ({
          then(resolve) {
            assimilated++;
            resolveThenable = resolve;
          },
        }),
        { synchronous: true }
      );
      instance.interceptors.request.use(
        (config) => {
          config.headers.set('X-Last-Valid', 'kept');
          return config;
        },
        null,
        { synchronous: true }
      );

      const requestPromise = instance.get('/original');

      // Flush microtasks so Promise.resolve invokes the thenable's .then handler.
      await Promise.resolve();
      expect(assimilated).toBe(1);
      expect(adapter).not.toHaveBeenCalled();

      resolveThenable({ url: '/ignored-replacement' });

      const response = await requestPromise;
      expect(response.data).toBe('sent');
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(adapter.mock.calls[0][0].url).toBe('/original');
      expect(adapter.mock.calls[0][0].headers.get('X-Last-Valid')).toBe('kept');
      expect(skippedInterceptor).not.toHaveBeenCalled();
    });

    it('waits for a pending thenable without catch that rejects asynchronously', async () => {
      const adapter = createMockAdapter();
      const instance = axios.create({ adapter });
      const asyncError = new Error('async thenable rejection');
      const responseRejectedSpy = vi.fn((reason) => Promise.reject(reason));
      let rejectThenable;

      instance.interceptors.request.use(
        () => {
          throw new Error('interceptor failed');
        },
        () => ({
          then(resolve, reject) {
            rejectThenable = reject;
          },
        }),
        { synchronous: true }
      );
      instance.interceptors.response.use(null, responseRejectedSpy);

      const requestPromise = instance.get('/test');
      await Promise.resolve();
      expect(adapter).not.toHaveBeenCalled();

      rejectThenable(asyncError);

      await expect(requestPromise).rejects.toBe(asyncError);
      expect(adapter).not.toHaveBeenCalled();
      expect(responseRejectedSpy).toHaveBeenCalledWith(asyncError);
    });

    it('treats objects with a non-callable then property as synchronous recovery', async () => {
      const adapter = createMockAdapter();
      const instance = axios.create({ adapter });

      instance.interceptors.request.use(
        () => {
          throw new Error('interceptor failed');
        },
        () => ({ then: 'not-a-function', url: '/ignored' }),
        { synchronous: true }
      );

      const requestPromise = instance.get('/original');

      // Synchronous recovery dispatches immediately without waiting for a microtask.
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(adapter.mock.calls[0][0].url).toBe('/original');
      expect((await requestPromise).data).toBe('sent');
    });

    it('rejects without dispatching when reading then throws on the rejection handler result', async () => {
      const adapter = createMockAdapter();
      const instance = axios.create({ adapter });
      const getterError = new Error('then getter threw');
      const responseRejectedSpy = vi.fn((reason) => Promise.reject(reason));

      instance.interceptors.request.use(
        () => {
          throw new Error('interceptor failed');
        },
        () => ({
          get then() {
            throw getterError;
          },
        }),
        { synchronous: true }
      );
      instance.interceptors.response.use(null, responseRejectedSpy);

      await expect(instance.get('/test')).rejects.toBe(getterError);
      expect(adapter).not.toHaveBeenCalled();
      expect(responseRejectedSpy).toHaveBeenCalledWith(getterError);
    });

    it('waits for a native Promise that fulfills and dispatches with the last valid config', async () => {
      const adapter = createMockAdapter();
      const instance = axios.create({ adapter });
      const skippedInterceptor = vi.fn((config) => config);
      let resolvePromise;

      instance.interceptors.request.use(skippedInterceptor, null, { synchronous: true });
      instance.interceptors.request.use(
        () => {
          throw new Error('interceptor failed');
        },
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
        { synchronous: true }
      );
      instance.interceptors.request.use(
        (config) => {
          config.headers.set('X-Last-Valid', 'kept');
          return config;
        },
        null,
        { synchronous: true }
      );

      const requestPromise = instance.get('/original');
      await Promise.resolve();
      expect(adapter).not.toHaveBeenCalled();

      resolvePromise({ url: '/ignored-replacement' });

      const response = await requestPromise;
      expect(response.data).toBe('sent');
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(adapter.mock.calls[0][0].url).toBe('/original');
      expect(adapter.mock.calls[0][0].headers.get('X-Last-Valid')).toBe('kept');
      expect(skippedInterceptor).not.toHaveBeenCalled();
    });

    it('assimilates a rejecting native Promise without dispatching the adapter', async () => {
      const adapter = createMockAdapter();
      const instance = axios.create({ adapter });
      const recoveryError = new Error('native promise rejection');
      const skippedInterceptor = vi.fn((config) => config);
      const responseRejectedSpy = vi.fn((reason) => Promise.reject(reason));

      instance.interceptors.request.use(skippedInterceptor, null, { synchronous: true });
      instance.interceptors.request.use(
        () => {
          throw new Error('interceptor failed');
        },
        () => Promise.reject(recoveryError),
        { synchronous: true }
      );
      instance.interceptors.response.use(null, responseRejectedSpy);

      await expect(instance.get('/test')).rejects.toBe(recoveryError);
      expect(adapter).not.toHaveBeenCalled();
      expect(skippedInterceptor).not.toHaveBeenCalled();
      expect(responseRejectedSpy).toHaveBeenCalledWith(recoveryError);
    });
  });
});
