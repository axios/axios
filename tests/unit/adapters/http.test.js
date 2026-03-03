import { describe, it } from 'vitest';
import assert from 'assert';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('supports http with nodejs', () => {
  it('should support IPv4 literal strings', async () => {
    const data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    });

    const { data: responseData } = await axios.get(`http://127.0.0.1:${server.address().port}`);

    assert.deepStrictEqual(responseData, data);

    await stopHTTPServer(server);
  });

  it('should support IPv6 literal strings', async () => {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    });

    const { data: responseData } = await axios.get(`http://[::1]:${server.address().port}`);

    assert.deepStrictEqual(responseData, data);

    await stopHTTPServer(server);
  });

  it('should throw an error if the timeout property is not parsable as a number', async () => {
    const server = await startHTTPServer((req, res) => {
      setTimeout(() => {
        res.end();
      }, 1000);
    });

    try {
      await axios.get(`http://127.0.0.1:${server.address().port}`, {
        timeout: { strangeTimeout: 250 },
      });
    } catch (error) {
      assert.strictEqual(error.code, AxiosError.ERR_BAD_OPTION_VALUE);
      assert.strictEqual(error.message, 'error trying to parse `config.timeout` to int');
    }

    await stopHTTPServer(server);
  });
});
