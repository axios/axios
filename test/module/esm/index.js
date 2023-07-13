import assert from 'assert';
import axios, {CanceledError, AxiosError, AxiosHeaders} from 'axios';
import settle from 'axios/unsafe/core/settle.js';

assert.strictEqual(typeof axios, 'function');
assert.strictEqual(typeof CanceledError, 'function');
assert.strictEqual(typeof AxiosError, 'function');
assert.strictEqual(typeof AxiosHeaders, 'function');

assert.strictEqual(axios.CanceledError, CanceledError);
assert.strictEqual(axios.AxiosError, AxiosError);
assert.strictEqual(axios.AxiosHeaders, AxiosHeaders);

assert.strictEqual(typeof settle, 'function');

console.log('ESM importing test passed');
