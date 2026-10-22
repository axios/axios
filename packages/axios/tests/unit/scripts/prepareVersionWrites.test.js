import { copyFile, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareVersion } from '../../../scripts/prepare-version.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    copyFile: vi.fn(actual.copyFile),
    writeFile: vi.fn(actual.writeFile),
    rename: vi.fn(actual.rename),
  };
});

const originalPackage =
  JSON.stringify(
    { name: 'axios', version: '1.2.3', contributors: ['Original contributor'] },
    null,
    4
  ) + '\n';
const originalEnv = 'export const VERSION = "1.0.0";\n';
const refreshedContributor = 'Release Contributor (https://github.com/release-contributor)';
const generatedEnv = 'export const VERSION = "2.0.0";';
const client = {
  async get(url) {
    return {
      data: url.endsWith('/contributors')
        ? [{ login: 'release-contributor', type: 'User', contributions: 3 }]
        : { name: 'Release Contributor' },
    };
  },
};

let actualFs;
let directory;
let packageFile;
let envFile;

beforeEach(async () => {
  actualFs = await vi.importActual('node:fs/promises');
  vi.mocked(copyFile).mockReset().mockImplementation(actualFs.copyFile);
  vi.mocked(writeFile).mockReset().mockImplementation(actualFs.writeFile);
  vi.mocked(rename).mockReset().mockImplementation(actualFs.rename);
  directory = await actualFs.mkdtemp(join(tmpdir(), 'axios-prepare-version-writes-'));
  packageFile = join(directory, 'package.json');
  envFile = join(directory, 'data.js');
  await actualFs.writeFile(packageFile, originalPackage);
  await actualFs.writeFile(envFile, originalEnv);
});

afterEach(async () => {
  await actualFs.rm(directory, { recursive: true, force: true, maxRetries: 3 });
});

function prepare() {
  return prepareVersion({ bump: 'v2.0.0', client, packageFile, envFile });
}

function pathOf(path) {
  return path instanceof URL ? fileURLToPath(path) : String(path);
}

async function expectOriginalFiles({ absentEnv = false } = {}) {
  expect(await actualFs.readFile(packageFile)).toEqual(Buffer.from(originalPackage));
  if (absentEnv) {
    await expect(actualFs.readFile(envFile)).rejects.toMatchObject({ code: 'ENOENT' });
  } else {
    expect(await actualFs.readFile(envFile)).toEqual(Buffer.from(originalEnv));
  }
  expect((await actualFs.readdir(directory)).sort()).toEqual(
    absentEnv ? ['package.json'] : ['data.js', 'package.json']
  );
}

function failPackageReplacement(error, { rollbackError } = {}) {
  const state = { replacementFailed: false, recoveryPath: undefined };
  vi.mocked(rename).mockImplementation(async (source, destination) => {
    const target = pathOf(destination);
    if (target === packageFile || target === envFile) {
      const contents = await actualFs.readFile(source, 'utf8');
      if (target === packageFile && contents.includes(refreshedContributor)) {
        // Prove that the earlier replacement really happened before injecting this failure.
        expect(await actualFs.readFile(envFile, 'utf8')).toBe(generatedEnv);
        state.replacementFailed = true;
        throw error;
      }
      if (rollbackError && target === envFile && contents === originalEnv) {
        state.recoveryPath = pathOf(source);
        throw rollbackError;
      }
    }
    return actualFs.rename(source, destination);
  });
  return state;
}

describe('prepareVersion file write recovery', () => {
  it.each(['version metadata', 'package manifest'])(
    'restores original bytes after a partial write of %s',
    async (target) => {
      const error = Object.assign(new Error(`Injected ${target} write failure`), { code: 'EIO' });
      let injected = false;
      vi.mocked(writeFile).mockImplementation(async (file, data, ...options) => {
        const replacement =
          target === 'version metadata'
            ? String(data).includes('"2.0.0"')
            : String(data).includes(refreshedContributor);
        if (!injected && replacement) {
          injected = true;
          await actualFs.writeFile(file, 'partially written contents', ...options);
          throw error;
        }
        return actualFs.writeFile(file, data, ...options);
      });

      await expect(prepare()).rejects.toThrow(error.message);
      expect(injected).toBe(true);
      await expectOriginalFiles();
    }
  );

  it.each(['version metadata', 'package manifest'])(
    'leaves both files unchanged after a partial backup copy of %s',
    async (target) => {
      const error = Object.assign(new Error(`Injected ${target} backup failure`), { code: 'EIO' });
      const original = target === 'version metadata' ? envFile : packageFile;
      let injected = false;
      vi.mocked(copyFile).mockImplementation(async (source, destination, ...options) => {
        if (!injected && pathOf(source) === original) {
          injected = true;
          await actualFs.writeFile(destination, 'partially copied contents');
          throw error;
        }
        return actualFs.copyFile(source, destination, ...options);
      });

      await expect(prepare()).rejects.toThrow(error.message);
      expect(injected).toBe(true);
      await expectOriginalFiles();
    }
  );

  it('leaves both files unchanged when the first replacement fails', async () => {
    const error = Object.assign(new Error('Injected metadata replacement failure'), {
      code: 'EIO',
    });
    let injected = false;
    vi.mocked(rename).mockImplementation(async (source, destination) => {
      if (
        pathOf(destination) === envFile &&
        (await actualFs.readFile(source, 'utf8')) === generatedEnv
      ) {
        injected = true;
        throw error;
      }
      return actualFs.rename(source, destination);
    });

    await expect(prepare()).rejects.toThrow(error.message);
    expect(injected).toBe(true);
    await expectOriginalFiles();
  });

  it('restores both original files when the later replacement fails', async () => {
    const error = Object.assign(new Error('Injected package replacement failure'), { code: 'EIO' });
    const state = failPackageReplacement(error);

    await expect(prepare()).rejects.toThrow(error.message);
    expect(state.replacementFailed).toBe(true);
    await expectOriginalFiles();
  });

  it('removes newly created metadata when the later replacement fails', async () => {
    await actualFs.rm(envFile);
    const error = Object.assign(new Error('Injected package replacement failure'), { code: 'EIO' });
    const state = failPackageReplacement(error);

    await expect(prepare()).rejects.toThrow(error.message);
    expect(state.replacementFailed).toBe(true);
    await expectOriginalFiles({ absentEnv: true });
  });

  it('retains recoverable original bytes and reports a failed rollback', async () => {
    const error = Object.assign(new Error('Injected package replacement failure'), { code: 'EIO' });
    const rollbackError = Object.assign(new Error('Injected metadata rollback failure'), {
      code: 'EACCES',
    });
    const state = failPackageReplacement(error, { rollbackError });
    let failure;
    try {
      await prepare();
    } catch (caught) {
      failure = caught;
    }

    expect(state.replacementFailed).toBe(true);
    expect(state.recoveryPath).toBeDefined();
    expect(failure).toBeInstanceOf(Error);
    expect(failure.message).toContain('rollback');
    expect(failure.message).toContain(state.recoveryPath);
    expect(await actualFs.readFile(state.recoveryPath)).toEqual(Buffer.from(originalEnv));
    expect(await actualFs.readFile(packageFile)).toEqual(Buffer.from(originalPackage));
  });

  it('removes temporary files after both updates succeed', async () => {
    await prepare();

    expect(await actualFs.readFile(envFile, 'utf8')).toBe(generatedEnv);
    expect(JSON.parse(await actualFs.readFile(packageFile, 'utf8'))).toMatchObject({
      version: '1.2.3',
      contributors: [refreshedContributor],
    });
    expect((await actualFs.readdir(directory)).sort()).toEqual(['data.js', 'package.json']);
  });
});
