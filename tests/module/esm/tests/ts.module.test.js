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
    target: 'es2016',
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
  },
};

describe('module ts compatibility', () => {
  it('compiles and executes import axios syntax', () => {
    const sourcePath = path.join(repoRoot, 'tests/module/esm/tests/helpers/esm-functions.ts');
    const fixturePath = createTempFixture(suiteRoot, 'ts', sourcePath, tsconfig, {
      type: 'commonjs',
    });

    try {
      runCommand('node', [tscBin, '-p', 'tsconfig.json'], { cwd: fixturePath });
      runCommand('node', ['index.js'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });
});
