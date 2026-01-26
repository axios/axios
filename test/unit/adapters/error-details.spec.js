/* eslint-env mocha */
import assert from 'assert';
import https from 'https';
import net from 'net';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import axios from '../../../index.js';

/** __dirname replacement for ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Get a port that will refuse connections: bind to a random port and close it. */
async function getClosedPort() {
  return await new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const {port} = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

describe('adapters – network-error details', function () {
  this.timeout(5000);

  it('should expose ECONNREFUSED and set error.cause on connection refusal', async function () {
    const port = await getClosedPort();

    try {
      await axios.get(`http://127.0.0.1:${port}`, { timeout: 500 });
      assert.fail('request unexpectedly succeeded');
    } catch (err) {
      assert.ok(err instanceof Error, 'should be an Error');
      assert.strictEqual(err.isAxiosError, true, 'isAxiosError should be true');

      // New behavior: Node error code is surfaced and original error is linked via cause
      assert.strictEqual(err.code, 'ECONNREFUSED');
      assert.ok('cause' in err, 'error.cause should exist');
      assert.ok(err.cause instanceof Error, 'cause should be an Error');
      assert.strictEqual(err.cause && err.cause.code, 'ECONNREFUSED');

      // Message remains a string (content may include the code prefix)
      assert.strictEqual(typeof err.message, 'string');
    }
  });

  it('should expose self-signed TLS error and set error.cause', async function () {
    // Use the same certs already present for adapter tests in this folder
    const keyPath  = path.join(__dirname, 'key.pem');
    const certPath = path.join(__dirname, 'cert.pem');

    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);

    const httpsServer = https.createServer({ key, cert }, (req, res) => res.end('ok'));

    await new Promise((resolve) => httpsServer.listen(0, '127.0.0.1', resolve));
    const {port} = httpsServer.address();

    try {
      await axios.get(`https://127.0.0.1:${port}`, {
        timeout: 500,
        httpsAgent: new https.Agent({ rejectUnauthorized: true }) // Explicit: reject self-signed
      });
      assert.fail('request unexpectedly succeeded');
    } catch (err) {
      const codeStr = String(err.code);
      // OpenSSL/Node variants: SELF_SIGNED_CERT_IN_CHAIN, DEPTH_ZERO_SELF_SIGNED_CERT, UNABLE_TO_VERIFY_LEAF_SIGNATURE
      assert.ok(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/.test(codeStr), 'unexpected TLS code: ' + codeStr);

      assert.ok('cause' in err, 'error.cause should exist');
      assert.ok(err.cause instanceof Error, 'cause should be an Error');

      const causeCode = String(err.cause && err.cause.code);
      assert.ok(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/.test(causeCode), 'unexpected cause code: ' + causeCode);

      assert.strictEqual(typeof err.message, 'string');
    } finally {
      await new Promise((resolve) => httpsServer.close(resolve));
    }
  });
});
