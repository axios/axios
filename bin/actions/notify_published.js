import minimist from "minimist";
import RepoBot from '../RepoBot.js';
import fs from 'fs/promises';

const argv = minimist(process.argv.slice(2));
console.log(argv);

let {tag} = argv;

(async() => {
  if (!tag || tag === true) {
    const {version} = JSON.parse((await fs.readFile('./package.json')).toString());

    tag = 'v' + version;
  } else if (typeof tag !== 'string') {

    throw new Error('tag must be a string');
  }

  const bot = new RepoBot();

  try {
    await bot.notifyPublishedPRs(tag);
  } catch (err) {
    console.warn('Error:', err.message);
  }
})();

