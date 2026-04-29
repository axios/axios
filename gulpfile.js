import gulp from 'gulp';
import fs from 'fs-extra';
import axios from './scripts/axios-build-instance.js';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

gulp.task('default', async function () {
  console.log('hello!');
});

const clear = gulp.task('clear', async function () {
  await fs.emptyDir('./dist/');
});

async function getContributors(user, repo, maxCount = 1) {
  const contributors = (
    await axios.get(
      `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/contributors`,
      { params: { per_page: maxCount } }
    )
  ).data;

  return Promise.all(
    contributors.map(async (contributor) => {
      return {
        ...contributor,
        ...(
          await axios.get(`https://api.github.com/users/${encodeURIComponent(contributor.login)}`)
        ).data,
      };
    })
  );
}

const packageJSON = gulp.task('package', async function () {
  const CONTRIBUTION_THRESHOLD = 3;

  const npm = JSON.parse(await fs.readFile('package.json'));

  try {
    const contributors = await getContributors('axios', 'axios', 15);

    npm.contributors = contributors
      .filter(
        ({ type, contributions }) =>
          type.toLowerCase() === 'user' && contributions >= CONTRIBUTION_THRESHOLD
      )
      .map(({ login, name, _ }) => `${name || login} (https://github.com/${login})`);

    await fs.writeFile('package.json', JSON.stringify(npm, null, 2));
  } catch (err) {
    if (axios.isAxiosError(err) && err.response && err.response.status === 403) {
      throw Error(`GitHub API Error: ${err.response.data && err.response.data.message}`);
    }
    throw err;
  }
});

const env = gulp.task('env', async function () {
  var npm = JSON.parse(await fs.readFile('package.json'));

  const envFilePath = './lib/env/data.js';

  await fs.writeFile(
    envFilePath,
    Object.entries({
      VERSION: (argv.bump || npm.version).replace(/^v/, ''),
    })
      .map(([key, value]) => {
        return `export const ${key} = ${JSON.stringify(value)};`;
      })
      .join('\n')
  );
});

const version = gulp.series('env', 'package');

export { env, clear, version, packageJSON };
