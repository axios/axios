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

const declarationTsconfig = {
  compilerOptions: {
    module: 'node16',
    strict: true,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
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

  [
    ['ESM', 'module'],
    ['CommonJS', 'commonjs'],
  ].forEach(([name, packageType]) => {
    it(`emits ${name} declarations for forwarded request response generics`, () => {
      const sourcePath = path.join(
        repoRoot,
        'tests/module/esm/tests/helpers/declaration-emit.ts'
      );
      const fixturePath = createTempFixture(
        suiteRoot,
        `declaration-emit-${packageType}`,
        sourcePath,
        declarationTsconfig,
        { type: packageType }
      );

      try {
        runCommand('node', [tscBin, '-p', 'tsconfig.json'], { cwd: fixturePath });
      } finally {
        cleanupTempFixture(fixturePath);
      }
    });
  });
});
