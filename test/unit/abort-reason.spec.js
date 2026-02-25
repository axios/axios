import axios from '../../lib/axios.js';
import assert from 'assert';

describe('AbortController abort reason', function () {
  it('should propagate abort reason to CanceledError', async function () {
    const controller = new AbortController();
    setTimeout(() => controller.abort('TimeoutError'), 10);

    try {
      await axios.get('http://10.255.255.1', { signal: controller.signal });
      assert.fail('Request should have been aborted');
    } catch (e) {
      assert.strictEqual(e.code, 'ERR_CANCELED');
      assert.strictEqual(e.message, 'TimeoutError');
    }
  });
});