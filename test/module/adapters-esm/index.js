import assert from 'assert';
import adapters from 'axios/adapters';

assert.strictEqual(typeof adapters.getAdapter, 'function');
assert.strictEqual(typeof adapters.adapters, 'object');

console.log('Adapters ESM importing test passed');
