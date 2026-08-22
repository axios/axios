import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { clearDist } from '../../scripts/clear-dist.js';
import { prepareVersion } from '../../scripts/prepare-version.js';

describe('build scripts', () => {
  it('clears the complete dist directory', async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'axios-clear-dist-'));
    const distDirectory = join(temporaryDirectory, 'dist');

    try {
      await mkdir(join(distDirectory, 'nested'), { recursive: true });
      await writeFile(join(distDirectory, 'nested', 'artifact.js'), 'generated');

      await clearDist(distDirectory);

      await expect(access(distDirectory)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it.each([
    [undefined, '1.2.3'],
    ['v2.0.0', '2.0.0'],
  ])('prepares version metadata with bump %s', async (bump, expectedVersion) => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'axios-prepare-version-'));
    const packageFile = join(temporaryDirectory, 'package.json');
    const envFile = join(temporaryDirectory, 'data.js');
    const client = {
      get: vi.fn(async (url) => {
        if (url.endsWith('/contributors')) {
          return {
            data: [
              { login: 'alice', type: 'User', contributions: 4 },
              { login: 'low-count', type: 'User', contributions: 2 },
              { login: 'automation', type: 'Bot', contributions: 10 },
            ],
          };
        }

        return {
          data: url.endsWith('/alice') ? { name: 'Alice Example' } : {},
        };
      }),
    };

    try {
      await writeFile(packageFile, JSON.stringify({ name: 'axios', version: '1.2.3' }));

      await prepareVersion({ bump, client, packageFile, envFile });

      expect(await readFile(envFile, 'utf8')).toBe(
        `export const VERSION = ${JSON.stringify(expectedVersion)};`
      );
      expect(JSON.parse(await readFile(packageFile, 'utf8'))).toEqual({
        name: 'axios',
        version: '1.2.3',
        contributors: ['Alice Example (https://github.com/alice)'],
      });
      expect(client.get).toHaveBeenCalledTimes(4);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
