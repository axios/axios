import minimist from "minimist";
import RepoBot from '../RepoBot.js';

const argv = minimist(process.argv.slice(2));
console.log(argv);

const tag = argv.tag;

if (!tag) {
  throw new Error('tag must be specified');
}

const bot = new RepoBot();

(async() => {
  try {
    await bot.notifyPublishedPRs(tag);
  } catch (err) {
    console.warn('Error:', err.message);
  }
})();

