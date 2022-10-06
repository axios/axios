import assert from 'assert';
import axios from '../../../index.js';

describe('issues', function () {
  describe('4999', function () {
    it('should not fail with query parsing', async function () {
      const {data} = await axios.get('https://postman-echo.com/get?foo1=bar1&foo2=bar2');

      assert.strictEqual(data.args.foo1, 'bar1');
      assert.strictEqual(data.args.foo2, 'bar2');
    });
  });
});
