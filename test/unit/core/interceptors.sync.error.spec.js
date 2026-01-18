'use strict';

import assert from 'assert';
import Axios from '../../../lib/core/Axios.js';

describe('interceptors', () => {
  it('[sync-error] should propagate the same error instance from synchronous request interceptor', async () => {
    const axios = new Axios({});

    let originalError;

    axios.interceptors.request.use(() => {
      originalError = new Error('Interceptor failed');
      throw originalError;
    }, null, { synchronous: true });

    try {
      await axios.request({ url: 'http://example.com' });
      assert.fail('Request should have thrown');
    } catch (err) {
      assert.strictEqual(err, originalError);
      assert.ok(err.stack);
      assert.ok(err.stack.includes('Interceptor failed'));
    }
  });
});
