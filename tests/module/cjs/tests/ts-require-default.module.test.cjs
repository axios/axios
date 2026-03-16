const path = require('path');
const { describe, it } = require('mocha');
const { createTempFixture, cleanupTempFixture } = require('./helpers/fixture.cjs');
const { runCommand } = require('./helpers/run-command.cjs');

const suiteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(suiteRoot, '../../..');
const tscBin = path.join(suiteRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const tsconfig = {
  compilerOptions: {
    target: 'es2016',
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
  },
};

describe('module ts-require-default compatibility', () => {
  it('compiles and executes require("axios").default imports', () => {
    const sourcePath = path.join(repoRoot, 'test/module/ts-require-default/index.ts');
    const fixturePath = createTempFixture(suiteRoot, 'ts-require-default', sourcePath, tsconfig);

    try {
      runCommand('node', [tscBin, '-p', 'tsconfig.json'], { cwd: fixturePath });
      runCommand('node', ['index.js'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });
});
