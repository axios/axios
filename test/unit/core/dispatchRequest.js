import assert from 'assert';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('dispatchRequest', () => {
  describe('timeout validation', () => {
    it('should reject negative timeout with ERR_BAD_OPTION_VALUE', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: -1000 });
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError, 'Should be an AxiosError');
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
        assert.ok(err.message.includes('-1000'), 'Error should include the invalid value');
        assert.ok(
          err.message.includes('non-negative'),
          'Error should mention non-negative requirement'
        );
      }
    });

    it('should reject -0.5 timeout with ERR_BAD_OPTION_VALUE', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: -0.5 });
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError, 'Should be an AxiosError');
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
      }
    });

    it('should reject Infinity timeout with ERR_BAD_OPTION_VALUE', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: Infinity });
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError, 'Should be an AxiosError');
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
        assert.ok(err.message.includes('finite'), 'Error should mention finite requirement');
      }
    });

    it('should reject -Infinity timeout with ERR_BAD_OPTION_VALUE', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: -Infinity });
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError, 'Should be an AxiosError');
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
      }
    });

    it('should allow zero timeout (disabled)', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: 0 });
      } catch (err) {
        assert.notStrictEqual(
          err.code,
          AxiosError.ERR_BAD_OPTION_VALUE,
          'timeout: 0 should not trigger validation error'
        );
      }
    });

    it('should allow undefined timeout', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: undefined });
      } catch (err) {
        assert.notStrictEqual(
          err.code,
          AxiosError.ERR_BAD_OPTION_VALUE,
          'timeout: undefined should not trigger validation error'
        );
      }
    });

    it('should allow null timeout', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: null });
      } catch (err) {
        assert.notStrictEqual(
          err.code,
          AxiosError.ERR_BAD_OPTION_VALUE,
          'timeout: null should not trigger validation error'
        );
      }
    });

    it('should allow positive finite timeout', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: 1000 });
      } catch (err) {
        assert.notStrictEqual(
          err.code,
          AxiosError.ERR_BAD_OPTION_VALUE,
          'Positive timeout should not trigger validation error'
        );
      }
    });

    it('should preserve backward compatibility with string timeout', async () => {
      // String timeouts like '250' are handled by adapters via parseInt
      // and should NOT be rejected by validation
      try {
        await axios.get('http://localhost:1', { timeout: '250' });
      } catch (err) {
        assert.notStrictEqual(
          err.code,
          AxiosError.ERR_BAD_OPTION_VALUE,
          'String timeout should not trigger validation error'
        );
      }
    });

    it('should reject negative string timeout with ERR_BAD_OPTION_VALUE', async () => {
      try {
        await axios.get('http://localhost:1', { timeout: '-500' });
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.ok(err instanceof AxiosError, 'Should be an AxiosError');
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
      }
    });
  });
});
