const fs = require('fs');
const assert = require('assert');
const axios  = require('../index.js');

const {version} = JSON.parse(fs.readFileSync('./package.json'));

console.log('Checking versions...\n----------------------------')

console.log(`Package version: v${version}`);
console.log(`Axios version: v${axios.VERSION}`);
console.log(`----------------------------`);

assert.strictEqual(
  version,
  axios.VERSION,
  `Version mismatch between package and Axios ${version} != ${axios.VERSION}`
);

console.log('✔️ PASSED\n');
