import { describe, it } from 'vitest';
import assert from 'assert';
import https from 'https';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from '../../../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getClosedPort = async () => {
  return await new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
};

describe('adapters - network-error details', () => {
  it('should expose ECONNREFUSED and set error.cause on connection refusal', async () => {
    const port = await getClosedPort();

    try {
      await axios.get(`http://127.0.0.1:${port}`, { timeout: 500 });
      assert.fail('request unexpectedly succeeded');
    } catch (err) {
      assert.ok(err instanceof Error, 'should be an Error');
      assert.strictEqual(err.isAxiosError, true, 'isAxiosError should be true');

      assert.strictEqual(err.code, 'ECONNREFUSED');
      assert.ok('cause' in err, 'error.cause should exist');
      assert.ok(err.cause instanceof Error, 'cause should be an Error');
      assert.strictEqual(err.cause && err.cause.code, 'ECONNREFUSED');

      assert.strictEqual(typeof err.message, 'string');
    }
  });

  it('should expose self-signed TLS error and set error.cause', async () => {
    const certsDir = path.resolve(__dirname, '../../../tests/unit/adapters/');
    const keyPath = path.join(certsDir, 'key.pem');
    const certPath = path.join(certsDir, 'cert.pem');

    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);

    const httpsServer = https.createServer({ key, cert }, (req, res) => res.end('ok'));

    await new Promise((resolve) => httpsServer.listen(0, '127.0.0.1', resolve));
    const { port } = httpsServer.address();

    try {
      await axios.get(`https://127.0.0.1:${port}`, {
        timeout: 500,
        httpsAgent: new https.Agent({ rejectUnauthorized: true }),
      });
      assert.fail('request unexpectedly succeeded');
    } catch (err) {
      const codeStr = String(err.code);
      assert.ok(
        /SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/.test(codeStr),
        `unexpected TLS code: ${codeStr}`
      );

      assert.ok('cause' in err, 'error.cause should exist');
      assert.ok(err.cause instanceof Error, 'cause should be an Error');

      const causeCode = String(err.cause && err.cause.code);
      assert.ok(
        /SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/.test(causeCode),
        `unexpected cause code: ${causeCode}`
      );

      assert.strictEqual(typeof err.message, 'string');
    } finally {
      await new Promise((resolve) => httpsServer.close(resolve));
    }
  });
});
