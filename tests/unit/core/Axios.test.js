import { describe, it, expect, vi } from 'vitest';
import axios from '../../../index.js';

describe('core::Axios', () => {
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
});
