import assert from 'assert';
import axios, { AxiosError, AxiosHeaders, Axios, CanceledError } from '../../../index.js';

describe('issues', function () {
  describe('4999', function () {
    it('should not fail with query parsing', async function () {
      const {data} = await axios.get('https://postman-echo.com/get?foo1=bar1&foo2=bar2');

      assert.strictEqual(data.args.foo1, 'bar1');
      assert.strictEqual(data.args.foo2, 'bar2');
    });
  });

  describe('5031', function () {
    it('should export class AxiosHeaders', async function () {
      assert.doesNotThrow(() => new AxiosHeaders(), 'class AxiosHeaders not exported');
    });

    it('should export class Axios', async function () {
      assert.doesNotThrow(() => new Axios(), 'class Axios not exported');
    });

    it('should export class AxiosError', async function () {
      assert.doesNotThrow(() => new AxiosError('Error'), 'class AxiosError not exported');
    });

    it('should export class CanceledError', async function () {
      assert.doesNotThrow(() => new CanceledError('Message'), 'class CanceledError not exported');
    });
  });
});
