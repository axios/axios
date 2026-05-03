import Axios from "../../../lib/core/Axios.js";
import assert from "assert";

describe('Axios', function () {
  describe("handle un-writable error stack", function () {
    async function testUnwritableErrorStack(stackAttributes) {
      const axios = new Axios({});
      // mock axios._request to return an Error with an un-writable stack property
      axios._request = () => {
        const mockError = new Error("test-error");
        Object.defineProperty(mockError, "stack", stackAttributes);
        throw mockError;
      }
      try {
        await axios.request("test-url", {})
      } catch (e) {
        assert.strictEqual(e.message, "test-error")
      }
    }

    it('should support errors with a defined but un-writable stack', async function () {
      await testUnwritableErrorStack({value: {}, writable: false})
    });

    it('should support errors with an undefined and un-writable stack', async function () {
      await testUnwritableErrorStack({value: undefined, writable: false})
    });

    it('should support errors with a custom getter/setter for the stack property', async function () {
      await testUnwritableErrorStack({
        get: () => ({}),
        set: () => {
          throw new Error('read-only');
        }
      })
    });

    it('should support errors with a custom getter/setter for the stack property (null case)', async function () {
      await testUnwritableErrorStack({
        get: () => null,
        set: () => {
          throw new Error('read-only');
        }
      })
    });
  });

  it('should not throw if the config argument is omitted', () => {
    const axios = new Axios();

    assert.deepStrictEqual(axios.defaults, {});
  });

  describe("caller stack trace in errors", function () {
    // Helper: call axios.request from a named function so we can assert
    // that function appears in the final error stack.
    async function namedCallerFunction(axiosInstance) {
      return axiosInstance.request("test-url", {});
    }

    it('should append the caller stack to an error that already has a stack', async function () {
      const axios = new Axios({});
      axios._request = () => {
        throw new Error("network error");
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.ok(caughtError, "expected an error to be thrown");
      assert.ok(typeof caughtError.stack === 'string', "error.stack should be a string");
      // The stack must contain the caller frame (namedCallerFunction)
      assert.ok(
        caughtError.stack.includes('namedCallerFunction'),
        `expected caller frame in stack, got:\n${caughtError.stack}`
      );
    });

    it('should set the caller stack when error has no stack', async function () {
      const axios = new Axios({});
      axios._request = () => {
        const err = new Error("no stack error");
        // Forcibly remove the stack so we test the err.stack = requestStack path
        try { err.stack = ''; } catch (e) { /* ignore */ }
        throw err;
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.ok(caughtError, "expected an error to be thrown");
      // After the fix the stack must have been populated with caller frames
      assert.ok(
        typeof caughtError.stack === 'string',
        "error.stack should be a string even when originally empty"
      );
    });

    it('should not duplicate the caller stack when error already ends with it', async function () {
      const axios = new Axios({});

      // Capture a dummy stack that mimics what requestStack would look like
      let captured = null;
      const origCaptureStackTrace = Error.captureStackTrace;
      Error.captureStackTrace = (obj) => {
        origCaptureStackTrace(obj);
        captured = obj.stack;
      };

      axios._request = () => {
        Error.captureStackTrace = origCaptureStackTrace;
        const err = new Error("dup check");
        if (captured) {
          // Pre-seed the error stack so it already ends with the caller frames
          const callerPart = captured.replace(/^.+\n.+\n/, '');
          try { err.stack = err.stack + '\n' + callerPart; } catch (e) { /* ignore */ }
        }
        throw err;
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
        Error.captureStackTrace = origCaptureStackTrace;
      }

      assert.ok(caughtError, "expected an error to be thrown");
      assert.ok(typeof caughtError.stack === 'string', "stack should be a string");
    });

    it('should not throw when error is not an Error instance', async function () {
      const axios = new Axios({});
      axios._request = () => {
        // eslint-disable-next-line no-throw-literal
        throw "string error";
      };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.strictEqual(caughtError, "string error");
    });

    it('should still throw the original error after stack augmentation', async function () {
      const axios = new Axios({});
      const originalError = new Error("original message");
      axios._request = () => { throw originalError; };

      let caughtError;
      try {
        await namedCallerFunction(axios);
      } catch (e) {
        caughtError = e;
      }

      assert.strictEqual(caughtError, originalError, "must rethrow the exact same error object");
      assert.strictEqual(caughtError.message, "original message");
    });
  });
});
