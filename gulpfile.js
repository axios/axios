import gulp from 'gulp';
import fs from 'fs-extra';
import axios from './bin/githubAxios.js';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

// Task to clear the dist directory
gulp.task('clear', async () => fs.emptyDir('./dist/'));

// Task to update bower.json based on package.json
gulp.task('bower', async () => {
  const npm = await fs.readJson('package.json');
  const bower = await fs.readJson('bower.json');
  ['name', 'description', 'version', 'homepage', 'license', 'keywords'].forEach(field => {
    bower[field] = npm[field];
  });
  await fs.writeJson('bower.json', bower, { spaces: 2 });
});

// Fetch contributors from GitHub
async function getContributors(user, repo, maxCount = 1) {
  const contributors = (await axios.get(`https://api.github.com/repos/${user}/${repo}/contributors`, { params: { per_page: maxCount } })).data;
  return Promise.all(contributors.map(async contributor => ({
    ...contributor,
    ...(await axios.get(`https://api.github.com/users/${contributor.login}`)).data
  })));
}

// Task to update package.json with contributors
gulp.task('package', async () => {
  const npm = await fs.readJson('package.json');
  try {
    const contributors = await getContributors('axios', 'axios', 15);
    npm.contributors = contributors
      .filter(({ type, contributions }) => type.toLowerCase() === 'user' && contributions >= 3)
      .map(({ login, name }) => `${name || login} (https://github.com/${login})`);
    await fs.writeJson('package.json', npm, { spaces: 2 });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response.status === 403) {
      throw new Error(`GitHub API Error: ${err.response.data.message}`);
    }
    throw err;
  }
});

// Task to write environment variables
gulp.task('env', async () => {
  const npm = await fs.readJson('package.json');
  const envFilePath = './lib/env/data.js';
  const content = `export const VERSION = ${JSON.stringify((argv.bump || npm.version).replace(/^v/, ''))};`;
  await fs.writeFile(envFilePath, content);
});

// Version task: runs bower, env, and package
gulp.task('version', gulp.series('bower', 'env', 'package'));

// Default task
gulp.task('default', () => console.log('hello!'));
