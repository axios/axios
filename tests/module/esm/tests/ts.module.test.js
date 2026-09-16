import fs from 'node:fs';
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
    skipLibCheck: false,
    declaration: true,
    emitDeclarationOnly: true,
    outDir: 'declarations',
  },
  files: ['index.ts'],
};

const declarationConsumerTsconfig = {
  compilerOptions: {
    module: 'node16',
    strict: true,
    skipLibCheck: false,
    noEmit: true,
  },
  files: ['consumer.ts'],
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
    it(`emits usable ${name} declarations for forwarded request response generics`, () => {
      const sourcePath = path.join(repoRoot, 'tests/module/esm/tests/helpers/declaration-emit.ts');
      const fixturePath = createTempFixture(
        suiteRoot,
        `declaration-emit-${packageType}`,
        sourcePath,
        declarationTsconfig,
        { type: packageType }
      );

      try {
        runCommand('node', [tscBin, '-p', 'tsconfig.json'], { cwd: fixturePath });

        fs.copyFileSync(
          path.join(repoRoot, 'tests/module/esm/tests/helpers/declaration-consumer.ts'),
          path.join(fixturePath, 'consumer.ts')
        );
        fs.writeFileSync(
          path.join(fixturePath, 'tsconfig.consumer.json'),
          JSON.stringify(declarationConsumerTsconfig, null, 2)
        );

        // The consumer imports from the output directory to exercise the emitted .d.ts.
        runCommand('node', [tscBin, '-p', 'tsconfig.consumer.json'], { cwd: fixturePath });
      } finally {
        cleanupTempFixture(fixturePath);
      }
    });
  });
});
