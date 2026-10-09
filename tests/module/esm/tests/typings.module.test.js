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
  it('type-checks esm axios typings', () => {
    const sourcePath = path.join(repoRoot, 'tests/module/esm/tests/helpers/esm-index.ts');
    const fixturePath = createTempFixture(suiteRoot, 'typings-esm', sourcePath, tsconfig, {
      type: 'module',
    });

    try {
      runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });

  it('type-checks additive esm public typings', () => {
    const sourcePath = path.join(repoRoot, 'tests/module/esm/tests/helpers/esm-added-types.ts');
    const fixturePath = createTempFixture(suiteRoot, 'typings-esm-added', sourcePath, tsconfig, {
      type: 'module',
    });

    try {
      runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });

  it('type-checks fetch Response constructors with browser declarations', () => {
    const sourcePath = path.join(repoRoot, 'tests/module/esm/tests/helpers/esm-fetch-types.ts');
    const fixturePath = createTempFixture(
      suiteRoot,
      'fetch-types-browser',
      sourcePath,
      {
        compilerOptions: {
          module: 'node16',
          lib: ['ES2022', 'DOM'],
          types: ['node'],
          strict: true,
          skipLibCheck: false,
        },
      },
      { type: 'module' }
    );

    try {
      runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
    } finally {
      cleanupTempFixture(fixturePath);
    }
  });

  // Node 20 types provide fetch globals without DOM. Run both package export
  // conditions here; the legacy CJS suite uses Node 12 types and DOM declarations.
  for (const mode of ['esm', 'cjs']) {
    it(`type-checks ${mode} imports and Response constructors without DOM declarations`, () => {
      const sourcePath = path.join(
        repoRoot,
        `tests/module/${mode}/tests/helpers/${mode}-fetch-types.ts`
      );
      const fixturePath = createTempFixture(
        suiteRoot,
        `fetch-types-node-${mode}`,
        sourcePath,
        {
          compilerOptions: {
            module: 'node16',
            lib: ['ES2022'],
            types: ['node'],
            strict: true,
            skipLibCheck: false,
          },
        },
        { type: mode === 'esm' ? 'module' : 'commonjs' }
      );

      try {
        runCommand('node', [tscBin, '--noEmit', '-p', 'tsconfig.json'], { cwd: fixturePath });
      } finally {
        cleanupTempFixture(fixturePath);
      }
    });
  }
});
