import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'assert';
import Axios from '../../../lib/core/Axios.js';

describe('caller stack trace in errors', () => {
  let axios;
  let originalRequest;

  beforeEach(() => {
    axios = new Axios({});
    originalRequest = axios._request;
  });

  afterEach(() => {
    if (originalRequest) {
      vi.spyOn(Axios.prototype, '_request').mockImplementation(originalRequest);
    }
    vi.restoreAllMocks();
  });

  // Helper: call axios.request from a named function so we can assert
  // that the function name appears in the final error stack.
  async function namedCallerFunction(axiosInstance) {
    return axiosInstance.request('test-url', {});
  }

  it('should append the caller frame to an error that already has a stack', async () => {
    vi.spyOn(Axios.prototype, '_request').mockImplementation(() => {
      const err = new Error('network error');
      // Pre-seed err.stack with only internal frames
      err.stack = 'Error: network error\n at AxiosError.from (axios.cjs:725:14)\n at handleRequestError (internal:1:1)';
      throw err;
    });

    let caughtError;
    try {
      await namedCallerFunction(axios);
    } catch (e) {
      caughtError = e;
    }

    assert.ok(caughtError, 'expected an error to be thrown');
    assert.ok(typeof caughtError.stack === 'string', 'error.stack should be a string');
    assert.ok(
      caughtError.stack.includes('namedCallerFunction'),
      `expected 'namedCallerFunction' in stack — caller frame was not appended:\n${caughtError.stack}`
    );
  });

  it('should set the caller stack when error has no stack', async () => {
    vi.spyOn(Axios.prototype, '_request').mockImplementation(() => {
      const err = new Error('no stack error');
      try { err.stack = ''; } catch (e) { /* un-writable on some engines */ }
      throw err;
    });

    let caughtError;
    try {
      await namedCallerFunction(axios);
    } catch (e) {
      caughtError = e;
    }

    assert.ok(caughtError, 'expected an error to be thrown');
    assert.ok(caughtError.stack, 'error.stack should be populated with caller frames when it was originally empty');
    assert.ok(
      caughtError.stack.includes('namedCallerFunction'),
      `expected 'namedCallerFunction' in stack after empty-stack assignment:\n${caughtError.stack}`
    );
  });

  it('should not duplicate caller frames when they are already present in the error stack', async () => {
    vi.spyOn(Axios.prototype, '_request').mockImplementation(() => {
      const err = new Error('dup check');
      // Pre-seed with the actual test file path that requestStack will capture
      // This ensures the guard detects the file path and skips the append
      err.stack = 'Error: dup check\n at axios_internal (axios.cjs:1:1)\n at namedCallerFunction (/tmp/axios-test/tests/unit/core/Axios.js.test.js:24:26)';
      throw err;
    });

    let caughtError;
    try {
      await namedCallerFunction(axios);
    } catch (e) {
      caughtError = e;
    }

    assert.ok(caughtError, 'expected an error to be thrown');
    assert.ok(typeof caughtError.stack === 'string', 'stack should be a string');
    
    // namedCallerFunction must appear exactly once — not duplicated
    const matches = caughtError.stack.match(/namedCallerFunction/g) || [];
    assert.strictEqual(
      matches.length,
      1,
      `expected 'namedCallerFunction' exactly once — duplication guard may have failed:\n${caughtError.stack}`
    );
  });

  it('should not throw when error is not an Error instance', async () => {
    vi.spyOn(Axios.prototype, '_request').mockImplementation(() => {
      // eslint-disable-next-line no-throw-literal
      throw 'string error';
    });

    let caughtError;
    try {
      await namedCallerFunction(axios);
    } catch (e) {
      caughtError = e;
    }

    assert.strictEqual(caughtError, 'string error', 'non-Error throws must be re-thrown unchanged');
  });

  it('should rethrow the exact same error object after stack augmentation', async () => {
    const originalError = new Error('original message');
    
    vi.spyOn(Axios.prototype, '_request').mockImplementation(() => {
      // Give it a stack with no user frames so augmentation is triggered
      originalError.stack = 'Error: original message\n at axios_internal (axios.cjs:1:1)';
      throw originalError;
    });

    let caughtError;
    try {
      await namedCallerFunction(axios);
    } catch (e) {
      caughtError = e;
    }

    assert.strictEqual(caughtError, originalError, 'must rethrow the exact same error object, not a wrapper');
    assert.strictEqual(caughtError.message, 'original message', 'error message must be unchanged');
    assert.ok(
      caughtError.stack.includes('namedCallerFunction'),
      `expected 'namedCallerFunction' in stack after augmentation:\n${caughtError.stack}`
    );
  });
});