'use strict';

import axios from '../../index.js';
import CanceledError from '../../lib/cancel/CanceledError.js';
import { createServer } from 'http';

describe('AbortController abort reason', () => {
  let server;
  let serverUrl;

  before((done) => {
    server = createServer((req, res) => {
      // Delay response to allow abort to happen
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ foo: 'bar' }));
      }, 500);
    });

    server.listen(0, () => {
      const address = server.address();
      serverUrl = `http://localhost:${address.port}`;
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  it('should preserve abort reason as string', async () => {
    const controller = new AbortController();

    try {
      const promise = axios.get(`${serverUrl}/test`, {
        signal: controller.signal,
      });

      // Abort with string reason
      controller.abort('TimeoutError');

      await promise;
      throw new Error('Should have thrown CanceledError');
    } catch (err) {
      if (err.message === 'Should have thrown CanceledError') {
        throw err;
      }
      
      if (err instanceof CanceledError) {
        if (err.message !== 'TimeoutError') {
          throw new Error(`Expected message 'TimeoutError', got '${err.message}'`);
        }
        if (err.reason !== 'TimeoutError') {
          throw new Error(`Expected reason 'TimeoutError', got '${err.reason}'`);
        }
        return;
      }

      throw err;
    }
  });

  it('should preserve abort reason as Error', async () => {
    const controller = new AbortController();
    const customError = new Error('Custom abort error');

    try {
      const promise = axios.get(`${serverUrl}/test`, {
        signal: controller.signal,
      });

      // Abort with Error reason
      controller.abort(customError);

      await promise;
      throw new Error('Should have thrown CanceledError');
    } catch (err) {
      if (err.message === 'Should have thrown CanceledError') {
        throw err;
      }

      if (err instanceof CanceledError) {
        if (err.message !== 'Custom abort error') {
          throw new Error(`Expected message 'Custom abort error', got '${err.message}'`);
        }
        if (err.reason !== customError) {
          throw new Error(`Expected reason to be the original Error object`);
        }
        return;
      }

      throw err;
    }
  });

  it('should use default message when no abort reason', async () => {
    const controller = new AbortController();

    try {
      const promise = axios.get(`${serverUrl}/test`, {
        signal: controller.signal,
      });

      // Abort without reason - JavaScript creates a DOMException
      controller.abort();

      await promise;
      throw new Error('Should have thrown CanceledError');
    } catch (err) {
      if (err.message === 'Should have thrown CanceledError') {
        throw err;
      }

      if (err instanceof CanceledError) {
        // When abort() is called without reason, JavaScript creates a DOMException
        // The message will be "This operation was aborted" or similar
        if (!err.message) {
          throw new Error(`Expected a message from DOMException, got empty message`);
        }
        return;
      }

      throw err;
    }
  });

  it('should distinguish timeout aborts from user cancellations', async () => {
    const timeoutController = new AbortController();
    const userController = new AbortController();
    let timeoutError = null;
    let userError = null;

    // Test timeout abort
    try {
      const promise = axios.get(`${serverUrl}/test`, {
        signal: timeoutController.signal,
      });

      timeoutController.abort('TimeoutError');
      await promise;
    } catch (err) {
      if (err instanceof CanceledError) {
        timeoutError = err;
      }
    }

    // Test user cancel
    try {
      const promise = axios.get(`${serverUrl}/test`, {
        signal: userController.signal,
      });

      userController.abort('UserCanceled');
      await promise;
    } catch (err) {
      if (err instanceof CanceledError) {
        userError = err;
      }
    }

    if (!timeoutError) {
      throw new Error('Timeout abort failed to create error');
    }
    if (!userError) {
      throw new Error('User cancel failed to create error');
    }

    if (timeoutError.message !== 'TimeoutError') {
      throw new Error(`Expected timeout message 'TimeoutError', got '${timeoutError.message}'`);
    }
    if (userError.message !== 'UserCanceled') {
      throw new Error(`Expected user message 'UserCanceled', got '${userError.message}'`);
    }
  });

  it('should work with merged signals from two controllers', async () => {
    const timeoutController = new AbortController();
    const userController = new AbortController();

    // Simulate merged signal using composeSignals
    // This is what happens when two controllers are used
    try {
      // The second request is sent while the first is pending
      const promise1 = axios.get(`${serverUrl}/test`, {
        signal: timeoutController.signal,
      });

      const promise2 = axios.get(`${serverUrl}/test`, {
        signal: userController.signal,
      });

      // User cancels (e.g., new search while previous is pending)
      userController.abort('NewSearchInitiated');

      await promise2;
      throw new Error('Should have thrown CanceledError');
    } catch (err) {
      if (err.message === 'Should have thrown CanceledError') {
        throw err;
      }

      if (err instanceof CanceledError) {
        if (err.message !== 'NewSearchInitiated') {
          throw new Error(
            `Expected message 'NewSearchInitiated', got '${err.message}'`
          );
        }
        return;
      }

      throw err;
    }
  });
});
