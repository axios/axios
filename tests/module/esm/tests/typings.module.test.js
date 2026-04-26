import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import { createTempFixture, cleanupTempFixture } from './helpers/fixture.js';
import { runCommand } from './helpers/run-command.js';

const suiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(suiteRoot, '../../..');
const tscBin = path.join(suiteRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const tsconfig = {
  compilerOptions: {
    checkJs: true,
    module: 'node16',
  },
};

describe('module esm typings compatibility', () => {
  it('type-checks esm axios typings', { timeout: 20000 }, () => {
    const sourcePath = path.join(repoRoot, 'tests/module/esm/tests/helpers/esm-index.ts');
    const fixturePath = createTempFixture(
      suiteRoot,
      repoRoot,
      'typings-esm',
      sourcePath,
      tsconfig,
      {
        type: 'module',
      }
    );

    try {
      runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });

  it('type-checks generic request transformer typings', { timeout: 20000 }, () => {
    const sourcePath = path.join(
      repoRoot,
      'tests/module/esm/tests/helpers/transform-request-typing.ts'
    );
    const fixturePath = createTempFixture(
      suiteRoot,
      repoRoot,
      'typings-esm-transform-request',
      sourcePath,
      tsconfig,
      {
        type: 'module',
      }
    );

    try {
      runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });
});
