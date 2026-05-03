import { describe, it } from 'vitest';
import assert from 'assert';
import Axios from '../../lib/core/Axios.js';

describe('Axios', () => {
  describe('handle un-writable error stack', () => {
    const testUnwritableErrorStack = async (stackAttributes) => {
      const axios = new Axios({});
      // Mock axios._request to return an Error with an un-writable stack property.
      axios._request = () => {
        const mockError = new Error('test-error');
        Object.defineProperty(mockError, 'stack', stackAttributes);
        throw mockError;
      };

      try {
        await axios.request('test-url', {});
      } catch (e) {
        assert.strictEqual(e.message, 'test-error');
      }
    };

    it('should support errors with a defined but un-writable stack', async () => {
      await testUnwritableErrorStack({ value: {}, writable: false });
    });

    it('should support errors with an undefined and un-writable stack', async () => {
      await testUnwritableErrorStack({ value: undefined, writable: false });
    });

    it('should support errors with a custom getter/setter for the stack property', async () => {
      await testUnwritableErrorStack({
        get: () => ({}),
        set: () => {
          throw new Error('read-only');
        },
      });
    });

    it('should support errors with a custom getter/setter for the stack property (null case)', async () => {
      await testUnwritableErrorStack({
        get: () => null,
        set: () => {
          throw new Error('read-only');
        },
      });
    });
  });

  it('should not throw if the config argument is omitted', () => {
    const axios = new Axios();

    assert.deepStrictEqual(axios.defaults, {});
  });

  describe('caller stack trace in errors', () => {
    // Helper: call axios.request from a named function so we can assert
    // that the function name appears in the final error stack.
    async function namedCallerFunction(axiosInstance) {
      return axiosInstance.request('test-url', {});
    }

    it('should append the caller frame to an error that already has a stack', async () => {
      const axios = new Axios({});
      axios._request = () => {
        // Simulate an adapter error whose stack contains only library-internal
        // frames — no reference to the user's call site.
        const err = new Error('network error');
        err.stack = `Error: network error\n    at AxiosError.from (axios.cjs:725:14)\n    at handleRequestError (follow-redirects:14:24)`;
        throw err;
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.ok(caughtError, 'expected an error to be thrown');
      assert.ok(typeof caughtError.stack === 'string', 'error.stack should be a string');
      // The stack MUST contain the caller frame so the user can find their code.
      assert.ok(
        caughtError.stack.includes('namedCallerFunction'),
        `expected 'namedCallerFunction' in stack — caller frame was not appended:\n${caughtError.stack}`
      );
    });

    it('should set the caller stack when error has no stack', async () => {
      const axios = new Axios({});
      axios._request = () => {
        const err = new Error('no stack error');
        try { err.stack = ''; } catch (e) { /* un-writable on some engines */ }
        throw err;
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.ok(caughtError, 'expected an error to be thrown');
      // stack must be truthy after the fix (was empty before)
      assert.ok(
        caughtError.stack,
        'error.stack should be populated with caller frames when it was originally empty'
      );
      assert.ok(
        caughtError.stack.includes('namedCallerFunction'),
        `expected 'namedCallerFunction' in stack after empty-stack assignment:\n${caughtError.stack}`
      );
    });

    it('should not duplicate caller frames when they are already present in the error stack', async () => {
      const axios = new Axios({});

      // Simulate an error whose stack already contains the caller's file path
      // (as V8 async-stack promotion would produce).  The duplication guard
      // must detect this and skip appending requestStack a second time.
      //
      // We call namedCallerFunction once just to discover the real file URL
      // of this test file, then use that path in the pre-seeded stack.
      let testFileUrl = '';
      const dummy = {};
      Error.captureStackTrace(dummy);
      // dummy.stack line 0 = 'Error', line 1 = this frame
      const thisLine = (dummy.stack.split('\n')[1] || '');
      const urlMatch = thisLine.match(/\(([^)]+):\d+:\d+\)/);
      if (urlMatch) {
        testFileUrl = urlMatch[1].replace(/:\d+:\d+$/, '');
      }

      axios._request = () => {
        const err = new Error('dup check');
        // Pre-seed err.stack with a frame that references the same file as
        // requestStack will — the guard must spot this and not append again.
        if (testFileUrl) {
          err.stack = 'Error: dup check\n'
            + '    at axios_internal (axios.cjs:1:1)\n'
            + '    at namedCallerFunction (' + testFileUrl + ':58:28)';
        }
        throw err;
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.ok(caughtError, 'expected an error to be thrown');
      assert.ok(typeof caughtError.stack === 'string', 'stack should be a string');

      // namedCallerFunction must appear exactly once — not duplicated.
      const matches = caughtError.stack.match(/namedCallerFunction/g) || [];
      assert.strictEqual(
        matches.length,
        1,
        `expected 'namedCallerFunction' exactly once — duplication guard may have failed:\n${caughtError.stack}`
      );
    });

    it('should not throw when error is not an Error instance', async () => {
      const axios = new Axios({});
      axios._request = () => {
        // eslint-disable-next-line no-throw-literal
        throw 'string error';
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.strictEqual(caughtError, 'string error',
        'non-Error throws must be re-thrown unchanged');
    });

    it('should rethrow the exact same error object after stack augmentation', async () => {
      const axios = new Axios({});
      const originalError = new Error('original message');
      // Give it a stack that has no user frames so augmentation is triggered.
      originalError.stack = 'Error: original message\n    at axios_internal (axios.cjs:1:1)';
      axios._request = () => { throw originalError; };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.strictEqual(caughtError, originalError,
        'must rethrow the exact same error object, not a wrapper');
      assert.strictEqual(caughtError.message, 'original message',
        'error message must be unchanged');
      // Caller frame must have been appended.
      assert.ok(
        caughtError.stack.includes('namedCallerFunction'),
        `expected 'namedCallerFunction' in stack after augmentation:\n${caughtError.stack}`
      );
    });
  });
});
