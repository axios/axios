import gulp from 'gulp';
import fs from 'fs-extra';
import axios from './bin/githubAPI.js';
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2));

  gulp.task('default', async function(){
  console.log('hello!');
});

const clear = gulp.task('clear', async function() {
  await fs.emptyDir('./dist/')
});

const bower = gulp.task('bower', async function () {
  const npm = JSON.parse(await fs.readFile('package.json'));
  const bower = JSON.parse(await fs.readFile('bower.json'));

  const fields = [
    'name',
    'description',
    'version',
    'homepage',
    'license',
    'keywords'
  ];

  for (let i = 0, l = fields.length; i < l; i++) {
    const field = fields[i];
    bower[field] = npm[field];
  }

  await fs.writeFile('bower.json', JSON.stringify(bower, null, 2));
});

/**
 * Retrieves contributors for a given GitHub repository.
 * @async
 * @function
 * @param {string} user - The GitHub username of the repository owner.
 * @param {string} repo - The name of the repository.
 * @param {number} [maxCount=1] - The maximum number of contributors to retrieve.
 * @returns {Promise<Array<Object>>} An array of contributor objects, each containing information about the contributor and their GitHub profile.
 * @throws {Error} If there is an issue retrieving the contributors or their profiles.
 */
async function getContributors(user, repo, maxCount = 1) {
  const contributors = (await axios.get(
    `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/contributors`,
    { params: { per_page: maxCount } }
  )).data;

  return Promise.all(contributors.map(async (contributor)=> {
    return {...contributor, ...(await axios.get(
      `https://api.github.com/users/${encodeURIComponent(contributor.login)}`
    )).data};
  }))
}

const packageJSON = gulp.task('package', async function () {
  const CONTRIBUTION_THRESHOLD = 3;

  const npm = JSON.parse(await fs.readFile('package.json'));

  try {
    const contributors = await getContributors('axios', 'axios', 15);

    npm.contributors = contributors
      .filter(
        ({type, contributions}) => type.toLowerCase() === 'user' && contributions >= CONTRIBUTION_THRESHOLD
      )
      .map(({login, name, url}) => `${name || login} (https://github.com/${login})`);

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

  await fs.writeFile(envFilePath, Object.entries({
    VERSION: (argv.bump || npm.version).replace(/^v/, '')
  }).map(([key, value]) => {
    return `export const ${key} = ${JSON.stringify(value)};`
  }).join('\n'));
});

const version = gulp.series('bower', 'env', 'package');

export {
  bower,
  env,
  clear,
  version,
  packageJSON
}
