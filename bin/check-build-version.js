import fs from 'fs';
import assert from 'assert';
import axios from '../index.js';
import axiosBuild from '../dist/node/axios.cjs';
import inquirer from 'inquirer';

const {version, name} = JSON.parse(fs.readFileSync('./package.json'));

console.log('Checking versions...\n----------------------------')

console.log(`Package version: v${version}`);
console.log(`Axios version: v${axios.VERSION}`);
console.log(`Axios build version: v${axiosBuild.VERSION}`);
console.log(`----------------------------`);

assert.strictEqual(version, axios.VERSION, `Version mismatch between package and Axios`);
assert.strictEqual(version, axiosBuild.VERSION, `Version mismatch between package and build`);

console.log('PASSED\n');

const choices = [
    `Yes, let's release Axios v${version} to npm`,
    `No, don't do an npm release - I'll do it myself`
  ];

inquirer
  .prompt([
    {
      type: 'list',
      name: 'release',
      message: `You have requested an npm release for ${name.toUpperCase()} v${version}. Are you sure?`,
      choices
    }
  ])
  .then((answers) => {
    if (choices.indexOf(answers.release)) {
      console.warn('terminate...');
      process.exit(1);
    }
  });


