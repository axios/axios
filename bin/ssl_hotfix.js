const {spawn} = require('child_process');

console.log(`Running on ${process.version}`);

const match = /v(\d+)/.exec(process.version);

const hotfixNeeded = match && match[1] > 16;

hotfixNeeded && console.warn('Setting --openssl-legacy-provider as ssl hotfix');

const test = spawn('npm', ['run', hotfixNeeded ? 'test:run:ssl-fix' : 'test:run'], {
  shell: true,
  stdio: 'inherit'
});

test.on('exit', function (code) {
  process.exit(code)
})
