import { copyFile, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const defaultPackageFile = new URL('../package.json', import.meta.url);
const defaultEnvFile = new URL('../lib/env/data.js', import.meta.url);

// Stage both replacements before committing either file, retaining originals for rollback.
async function writeReleaseFiles(updates) {
  const staged = [];
  const errors = [];
  const recoveryPaths = [];

  try {
    for (const { file, contents } of updates) {
      const path = file instanceof URL ? fileURLToPath(file) : resolve(file);
      const directory = await mkdtemp(join(dirname(path), '.axios-version-'));
      const entry = {
        path,
        directory,
        backup: join(directory, 'original'),
        replacement: join(directory, 'next'),
        existed: false,
        replaced: false,
        retain: false,
      };
      staged.push(entry);

      try {
        await copyFile(path, entry.backup);
        entry.existed = true;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      if (entry.existed) await copyFile(entry.backup, entry.replacement);
      await writeFile(entry.replacement, contents);
    }

    for (const entry of staged) {
      await rename(entry.replacement, entry.path);
      entry.replaced = true;
    }
  } catch (error) {
    errors.push(error);

    for (const entry of [...staged].reverse()) {
      if (!entry.replaced) continue;

      try {
        if (entry.existed) await rename(entry.backup, entry.path);
        else await rm(entry.path);
      } catch (rollbackError) {
        entry.retain = true;
        recoveryPaths.push(entry.existed ? entry.backup : entry.path);
        errors.push(rollbackError);
      }
    }
  }

  for (const entry of staged) {
    if (entry.retain) continue;

    try {
      await rm(entry.directory, { recursive: true, force: true });
    } catch (cleanupError) {
      errors.push(cleanupError);
    }
  }

  if (errors.length > 1) {
    const message = recoveryPaths.length
      ? `Release file rollback failed; recovery paths: ${recoveryPaths.join(', ')}`
      : 'Release file preparation or temporary-file cleanup failed';
    throw new AggregateError(errors, message);
  }
  if (errors.length) throw errors[0];
}

export async function getContributors(client, user, repo, maxCount = 1) {
  const contributors = (
    await client.get(
      `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/contributors`,
      { params: { per_page: maxCount } }
    )
  ).data;

  return Promise.all(
    contributors.map(async (contributor) => ({
      ...contributor,
      ...(await client.get(`https://api.github.com/users/${encodeURIComponent(contributor.login)}`))
        .data,
    }))
  );
}

export async function prepareVersion({
  bump,
  client,
  packageFile = defaultPackageFile,
  envFile = defaultEnvFile,
} = {}) {
  const contributionThreshold = 3;
  const packageJSON = JSON.parse(await readFile(packageFile, 'utf8'));
  const version = (bump || packageJSON.version).replace(/^v/, '');
  const requestClient = client || (await import('./axios-build-instance.js')).default;

  try {
    const contributors = await getContributors(requestClient, 'axios', 'axios', 15);

    packageJSON.contributors = contributors
      .filter(
        ({ type, contributions }) =>
          type.toLowerCase() === 'user' && contributions >= contributionThreshold
      )
      .map(({ login, name }) => `${name || login} (https://github.com/${login})`);
  } catch (err) {
    const detail =
      (err && err.response && err.response.data && err.response.data.message) ||
      (err && err.message) ||
      String(err);
    console.warn(`Unable to refresh GitHub contributors; keeping existing contributors: ${detail}`);
  }

  await writeReleaseFiles([
    { file: envFile, contents: `export const VERSION = ${JSON.stringify(version)};` },
    { file: packageFile, contents: `${JSON.stringify(packageJSON, null, 2)}\n` },
  ]);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const {
    values: { bump },
  } = parseArgs({
    options: {
      bump: {
        type: 'string',
      },
    },
  });

  await prepareVersion({ bump });
}
