import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import axios from '../index.js';

const defaultPackageFile = new URL('../package.json', import.meta.url);
const defaultEnvFile = new URL('../lib/env/data.js', import.meta.url);

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

  await writeFile(envFile, `export const VERSION = ${JSON.stringify(version)};`);

  try {
    const contributors = await getContributors(requestClient, 'axios', 'axios', 15);

    packageJSON.contributors = contributors
      .filter(
        ({ type, contributions }) =>
          type.toLowerCase() === 'user' && contributions >= contributionThreshold
      )
      .map(({ login, name }) => `${name || login} (https://github.com/${login})`);

    await writeFile(packageFile, JSON.stringify(packageJSON, null, 2));
  } catch (err) {
    if (axios.isAxiosError(err) && err.response && err.response.status === 403) {
      throw new Error(`GitHub API Error: ${err.response.data && err.response.data.message}`);
    }

    throw err;
  }
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
