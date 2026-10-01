import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from '../../../index.js';
import { prepareVersion } from '../../../scripts/prepare-version.js';

const cachedContributors = ['Original contributor'];
const originalPackage =
  JSON.stringify({ name: 'axios', version: '1.2.3', contributors: cachedContributors }, null, 4) +
  '\n';
const originalEnv = 'export const VERSION = "1.0.0";\n';
const alice = { login: 'alice', type: 'User', contributions: 4 };
const bob = { login: 'bob', type: 'User', contributions: 3 };

let directory;
let packageFile;
let envFile;
let warning;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'axios-prepare-version-'));
  packageFile = join(directory, 'package.json');
  envFile = join(directory, 'data.js');
  warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await Promise.all([writeFile(packageFile, originalPackage), writeFile(envFile, originalEnv)]);
});

afterEach(async () => {
  warning.mockRestore();
  await rm(directory, { recursive: true, force: true });
});

async function expectPreparedFiles(version, contributors) {
  const manifest = await readFile(packageFile, 'utf8');

  expect(manifest.endsWith('}\n')).toBe(true);
  expect(JSON.parse(manifest)).toEqual({ name: 'axios', version: '1.2.3', contributors });
  expect(await readFile(envFile, 'utf8')).toBe(`export const VERSION = "${version}";`);
}

function expectContributorWarning() {
  expect(warning).toHaveBeenCalledTimes(1);
  const message = warning.mock.calls[0].map(String).join(' ');
  expect(message).toMatch(/contributor/i);
  return message;
}

describe('prepareVersion release file updates', () => {
  it('uses cached contributors and the requested version when the request fails', async () => {
    const client = { get: vi.fn().mockRejectedValue(new Error('GitHub request failed')) };

    await prepareVersion({ bump: 'v2.0.0', client, packageFile, envFile });

    await expectPreparedFiles('2.0.0', cachedContributors);
    expect(expectContributorWarning()).toContain('GitHub request failed');
  });

  it('keeps the complete cached list when a later contributor profile request fails', async () => {
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ data: [alice, bob] })
        .mockResolvedValueOnce({ data: { name: 'Refreshed Alice' } })
        .mockRejectedValue(new Error('GitHub profile request failed')),
    };

    await prepareVersion({ client, packageFile, envFile });

    await expectPreparedFiles('1.2.3', cachedContributors);
    expect(expectContributorWarning()).toContain('GitHub profile request failed');
  });

  it('warns with the GitHub 403 detail and still prepares the release', async () => {
    const error = new AxiosError('Request failed with status code 403');
    error.response = { status: 403, data: { message: 'API rate limit exceeded' } };
    const client = { get: vi.fn().mockRejectedValue(error) };

    await prepareVersion({ client, packageFile, envFile });

    await expectPreparedFiles('1.2.3', cachedContributors);
    expect(expectContributorWarning()).toContain('API rate limit exceeded');
  });

  it.each([
    ['a non-array contributor list', { message: 'Invalid response' }, [], /array|map|list/i],
    [
      'a malformed contributor profile',
      [alice, bob],
      [{ name: 'Refreshed Alice' }, { type: null }],
      /null|type|profile/i,
    ],
  ])('uses cached contributors for %s', async (_, contributors, profiles, detail) => {
    const client = { get: vi.fn().mockResolvedValueOnce({ data: contributors }) };
    for (const profile of profiles) client.get.mockResolvedValueOnce({ data: profile });

    await prepareVersion({ client, packageFile, envFile });

    await expectPreparedFiles('1.2.3', cachedContributors);
    expect(expectContributorWarning()).toMatch(detail);
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
              bob,
              { login: 'low-count', type: 'User', contributions: 2 },
              { login: 'automation', type: 'Bot', contributions: 10 },
            ],
          };
        }

        return { data: { name: url.endsWith('/alice') ? 'Alice Example' : '' } };
      }),
    };

    await prepareVersion({ bump, client, packageFile, envFile });

    await expectPreparedFiles(version, [
      'Alice Example (https://github.com/alice)',
      'bob (https://github.com/bob)',
    ]);
    expect(warning).not.toHaveBeenCalled();
  });
});
