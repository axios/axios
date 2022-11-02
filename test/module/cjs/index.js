const axios = require('axios');
const assert = require('assert');

const {CanceledError, AxiosError, AxiosHeaders} = axios;

assert.strictEqual(typeof axios, 'function');
assert.strictEqual(typeof CanceledError, 'function');
assert.strictEqual(typeof AxiosError, 'function');
assert.strictEqual(typeof AxiosHeaders, 'function');

console.log('CommonJS importing test passed');
