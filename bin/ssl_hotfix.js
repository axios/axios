import {spawn} from 'child_process';

const args = process.argv.slice(2);

console.log(`Running ${args.join(' ')} on ${process.version}\n`);

const match = /v(\d+)/.exec(process.version);

const isHotfixNeeded = match && match[1] > 16;

isHotfixNeeded && console.warn('Setting --openssl-legacy-provider as ssl hotfix');

const test = spawn('cross-env',
  isHotfixNeeded ? ['NODE_OPTIONS=--openssl-legacy-provider', ...args] : args, {
    shell: true,
    stdio: 'inherit'
  }
);

test.on('exit', function (code) {
  process.exit(code)
})
