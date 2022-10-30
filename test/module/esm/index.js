import assert from 'assert';
import axios, {CanceledError, AxiosError, AxiosHeaders} from 'axios';

assert.strictEqual(typeof axios, 'function');
assert.strictEqual(typeof CanceledError, 'function');
assert.strictEqual(typeof AxiosError, 'function');
assert.strictEqual(typeof AxiosHeaders, 'function');

assert.strictEqual(axios.CanceledError, CanceledError);
assert.strictEqual(axios.AxiosError, AxiosError);
assert.strictEqual(axios.AxiosHeaders, AxiosHeaders);

console.log('ESM importing test passed');
