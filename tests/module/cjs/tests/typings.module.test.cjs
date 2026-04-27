const path = require('path');
const { describe, it } = require('mocha');
const { createTempFixture, cleanupTempFixture } = require('./helpers/fixture.cjs');
const { runCommand } = require('./helpers/run-command.cjs');

const suiteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(suiteRoot, '../../..');
const tscBin = path.join(suiteRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const tsconfig = {
  compilerOptions: {
    checkJs: true,
    module: 'node16',
  },
};

describe('module cjs typings compatibility', () => {
  it('type-checks commonjs axios typings', () => {
    const sourcePath = path.join(repoRoot, 'tests/module/cjs/tests/helpers/cjs-typing.ts');
    const fixturePath = createTempFixture(suiteRoot, 'typings-cjs', sourcePath, tsconfig);

    try {
      runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });
});
