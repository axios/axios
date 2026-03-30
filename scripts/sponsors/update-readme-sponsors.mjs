import fs from 'fs/promises';
import _axios from '../../index.js';

const axios = _axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  },
});

const getWithRetry = (url, retries = 3) => {
  let counter = 0;
  const doRequest = async () => {
    try {
      return await axios.get(url);
    } catch (err) {
      if (counter++ >= retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, counter ** counter * 1000));
      return doRequest();
    }
  };

  return doRequest();
};

const setGithubOutput = async (key, value) => {
  if (!process.env.GITHUB_OUTPUT) {
    console.warn(`GITHUB_OUTPUT is not set; skipping output ${key}=${value}`);
    return;
  }

  await fs.appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
};

const updateReadmeSponsors = async (url, path, marker = '<!--<div>marker</div>-->') => {
  let fileContent = (await fs.readFile(path)).toString();

  const index = fileContent.indexOf(marker);

  if (index >= 0) {
    const readmeContent = fileContent.slice(index);

    let { data: sponsorContent } = await getWithRetry(url);
    sponsorContent += '\n';

    const currentSponsorContent = fileContent.slice(0, index);

    if (currentSponsorContent !== sponsorContent) {
      console.log(`Sponsor block in [${path}] is outdated`);
      await fs.writeFile(path, sponsorContent + readmeContent);
      return sponsorContent;
    }

    console.log(`Sponsor block in [${path}] is up to date`);
  } else {
    console.warn(`Can not find marker (${marker}) in ${path} to inject sponsor block`);
  }

  return false;
};

(async (url) => {
  const newContent = await updateReadmeSponsors(url, './README.md');

  await setGithubOutput('changed', newContent ? 'true' : 'false');
  if (newContent !== false) {
    await fs.mkdir('./temp').catch(() => {});
    await fs.writeFile('./temp/sponsors.md', newContent);
  }
})('https://axios-http.com/data/sponsors.md');
