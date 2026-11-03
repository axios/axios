import { describe, it } from 'vitest';
import { runModuleInChildProcess } from '../setup/runModuleInChildProcess.js';

describe('initialization', () => {
  it('loads and serializes errors alongside a read-only Error.prototype.toJSON', async () => {
    // Install the serializer before loading axios in a fresh module graph.
    await runModuleInChildProcess(`
      import assert from 'node:assert/strict';

      const serializeError = function () {
        return { external: this.message };
      };
      const descriptor = {
        configurable: true,
        enumerable: false,
        writable: false,
        value: serializeError
      };
      Object.defineProperty(Error.prototype, 'toJSON', descriptor);

      const { default: axios } = await import(
        ${JSON.stringify(new URL('../../index.js', import.meta.url).href)}
      );
      const { AxiosError, CanceledError } = axios;

      const error = new AxiosError('request failed', AxiosError.ERR_NETWORK);
      assert.ok(error instanceof Error);
      assert.ok(axios.isAxiosError(error));
      assert.equal(JSON.parse(JSON.stringify(error)).message, 'request failed');
      assert.equal(error.toJSON().code, AxiosError.ERR_NETWORK);

      const canceled = new CanceledError('request canceled');
      assert.ok(canceled instanceof AxiosError);
      assert.ok(axios.isCancel(canceled));
      assert.equal(JSON.parse(JSON.stringify(canceled)).message, 'request canceled');
      assert.equal(canceled.toJSON().code, AxiosError.ERR_CANCELED);

      assert.deepEqual(JSON.parse(JSON.stringify(new Error('external error'))), {
        external: 'external error'
      });
      assert.deepEqual(Object.getOwnPropertyDescriptor(Error.prototype, 'toJSON'), descriptor);
    `);
  });
});
