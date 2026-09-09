import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from '../../../index.js';
import { prepareVersion } from '../../../scripts/prepare-version.js';

const originalPackage =
  JSON.stringify(
    { name: 'axios', version: '1.2.3', contributors: ['Original contributor'] },
    null,
    4
  ) + '\n';
const originalEnv = 'export const VERSION = "1.0.0";\n';
const alice = { login: 'alice', type: 'User', contributions: 4 };

let directory;
let packageFile;
let envFile;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'axios-prepare-version-'));
  packageFile = join(directory, 'package.json');
  envFile = join(directory, 'data.js');
  await Promise.all([writeFile(packageFile, originalPackage), writeFile(envFile, originalEnv)]);
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

async function expectOriginalFiles() {
  expect(await readFile(packageFile)).toEqual(Buffer.from(originalPackage));
  expect(await readFile(envFile)).toEqual(Buffer.from(originalEnv));
}

describe('prepareVersion release file updates', () => {
  it('leaves both files unchanged when the contributor request fails', async () => {
    const error = new Error('GitHub request failed');
    const client = { get: vi.fn().mockRejectedValue(error) };

    await expect(prepareVersion({ client, packageFile, envFile })).rejects.toBe(error);
    await expectOriginalFiles();
  });

  it('leaves both files unchanged when a contributor profile request fails', async () => {
    const error = new Error('GitHub profile request failed');
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ data: [alice] })
        .mockRejectedValue(error),
    };

    await expect(prepareVersion({ client, packageFile, envFile })).rejects.toBe(error);
    await expectOriginalFiles();
  });

  it('preserves the GitHub 403 message without changing either file', async () => {
    const error = new AxiosError('Request failed with status code 403');
    error.response = { status: 403, data: { message: 'API rate limit exceeded' } };
    const client = { get: vi.fn().mockRejectedValue(error) };

    await expect(prepareVersion({ client, packageFile, envFile })).rejects.toThrow(
      'GitHub API Error: API rate limit exceeded'
    );
    await expectOriginalFiles();
  });

  it.each([
    ['a non-array contributor list', { message: 'Invalid response' }, {}],
    ['a malformed contributor profile', [alice], { type: null }],
  ])('leaves both files unchanged for %s', async (_, contributors, profile) => {
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ data: contributors })
        .mockResolvedValue({ data: profile }),
    };

    await expect(prepareVersion({ client, packageFile, envFile })).rejects.toBeInstanceOf(
      TypeError
    );
    await expectOriginalFiles();
  });

  it.each([
    [undefined, '1.2.3'],
    ['v2.0.0', '2.0.0'],
  ])('updates both files after successful preparation with bump %s', async (bump, version) => {
    const client = {
      get: vi.fn(async (url) => {
        if (url.endsWith('/contributors')) {
          return {
            data: [
              alice,
              { login: 'bob', type: 'User', contributions: 3 },
              { login: 'low-count', type: 'User', contributions: 2 },
              { login: 'automation', type: 'Bot', contributions: 10 },
            ],
          };
        }

        return { data: { name: url.endsWith('/alice') ? 'Alice Example' : '' } };
      }),
    };

    await prepareVersion({ bump, client, packageFile, envFile });

    expect(await readFile(envFile, 'utf8')).toBe(`export const VERSION = "${version}";`);
    expect(JSON.parse(await readFile(packageFile, 'utf8'))).toEqual({
      name: 'axios',
      version: '1.2.3',
      contributors: ['Alice Example (https://github.com/alice)', 'bob (https://github.com/bob)'],
    });
  });
});
