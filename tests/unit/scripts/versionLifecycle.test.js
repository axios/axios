import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const packageFile = new URL('../../../package.json', import.meta.url);
const preparationScript = new URL('../../../scripts/prepare-version.js', import.meta.url).href;
const initialVersion = '1.2.3';
const refreshedContributor = 'Release Contributor (https://github.com/release-contributor)';
let directory;

function run(command, args, options = {}) {
  const env = { ...process.env };

  // Prevent an outer Git command from redirecting fixture operations to another repository.
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_')) delete env[key];
  }

  return execFileSync(command, args, {
    cwd: directory,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...env,
      npm_config_cache: join(directory, '.npm-cache'),
      npm_config_offline: 'true',
      npm_config_update_notifier: 'false',
    },
    ...options,
  }).trim();
}

function git(...args) {
  return run('git', args);
}

function npm(...args) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args]);
  }

  const windows = process.platform === 'win32';
  return run(windows ? 'npm.cmd' : 'npm', args, { shell: windows });
}

afterEach(async () => {
  if (directory) {
    await rm(directory, { recursive: true, force: true, maxRetries: 3 });
    directory = undefined;
  }
});

describe('npm version lifecycle', () => {
  it.each([
    ['patch', '1.2.4'],
    ['minor', '1.3.0'],
    ['major', '2.0.0'],
    ['prerelease', '1.2.4-rc.0'],
  ])(
    'builds and commits the bumped %s version',
    async (bump, expectedVersion) => {
      directory = await mkdtemp(join(tmpdir(), 'axios-version-lifecycle-'));
      const actualPackage = JSON.parse(await readFile(packageFile, 'utf8'));
      const scripts = { build: 'node scripts/build.js' };

      for (const name of ['preversion', 'version', 'postversion', 'prepare:version']) {
        if (actualPackage.scripts[name]) scripts[name] = actualPackage.scripts[name];
      }

      await mkdir(join(directory, 'scripts'));
      await mkdir(join(directory, 'lib', 'env'), { recursive: true });
      await writeFile(
        join(directory, 'package.json'),
        JSON.stringify({
          name: 'axios-version-lifecycle-fixture',
          private: true,
          type: 'module',
          version: initialVersion,
          contributors: ['Original Contributor'],
          scripts,
        })
      );
      await writeFile(
        join(directory, 'lib', 'env', 'data.js'),
        `export const VERSION = "${initialVersion}";`
      );
      await writeFile(join(directory, '.gitignore'), 'dist/\n.npm-cache/\n');
      await writeFile(
        join(directory, '.npmrc'),
        await readFile(new URL('../../../.npmrc', import.meta.url))
      );
      await writeFile(
        join(directory, 'scripts', 'prepare-version.js'),
        `import { prepareVersion } from ${JSON.stringify(preparationScript)};
prepareVersion({
  packageFile: new URL('../package.json', import.meta.url),
  envFile: new URL('../lib/env/data.js', import.meta.url),
  client: {
    async get(url) {
      return {
        data: url.endsWith('/contributors')
          ? [{ login: 'release-contributor', type: 'User', contributions: 3 }]
          : { name: 'Release Contributor' },
      };
    },
  },
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`
      );
      await writeFile(
        join(directory, 'scripts', 'build.js'),
        `import { mkdirSync, writeFileSync } from 'node:fs';
import { VERSION } from '../lib/env/data.js';
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/version.json', import.meta.url), JSON.stringify({ VERSION }));
`
      );

      git('init', '--quiet');
      git('config', 'user.name', 'Axios Lifecycle Test');
      git('config', 'user.email', 'axios-lifecycle-test@example.invalid');
      git('config', 'commit.gpgsign', 'false');
      git('config', 'tag.gpgsign', 'false');
      git('config', 'core.hooksPath', '.git/disabled-hooks');
      git('config', 'core.autocrlf', 'false');
      git('add', '.');
      git('commit', '--quiet', '-m', 'Initial fixture');

      const args = [
        'version',
        bump,
        '--ignore-scripts=false',
        '--git-tag-version=true',
        '--sign-git-tag=false',
        '--commit-hooks=false',
        '--tag-version-prefix=v',
      ];
      if (bump === 'prerelease') args.push('--preid=rc');
      npm(...args);

      const bumpedPackage = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      const expectedMetadata = `export const VERSION = "${expectedVersion}";`;
      expect(bumpedPackage.version).toBe(expectedVersion);
      expect(await readFile(join(directory, 'lib', 'env', 'data.js'), 'utf8')).toBe(
        expectedMetadata
      );
      expect(JSON.parse(await readFile(join(directory, 'dist', 'version.json'), 'utf8'))).toEqual({
        VERSION: expectedVersion,
      });
      expect(bumpedPackage.contributors).toEqual([refreshedContributor]);
      expect(git('show', 'HEAD:lib/env/data.js')).toBe(expectedMetadata);
      expect(git('show', `v${expectedVersion}:lib/env/data.js`)).toBe(expectedMetadata);
      expect(JSON.parse(git('show', `v${expectedVersion}:package.json`))).toMatchObject({
        version: expectedVersion,
        contributors: [refreshedContributor],
      });
      expect(git('rev-parse', `v${expectedVersion}^{commit}`)).toBe(git('rev-parse', 'HEAD'));
      expect(git('status', '--porcelain')).toBe('');
    },
    30000
  );
});
