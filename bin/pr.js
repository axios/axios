import Handlebars from "handlebars";
import fs from "fs/promises";
import prettyBytes from 'pretty-bytes';
import {gzipSize} from 'gzip-size';
import {getBlobHistory} from './repo.js';

const generateFileReport = async (files) => {
  const stat = {};

  for(const [name, file] of Object.entries(files)) {
    const commits = await getBlobHistory(file);

    stat[file] = {
      name,
      size: (await fs.stat(file)).size,
      path: file,
      gzip: await gzipSize(String(await fs.readFile(file))),
      commits,
      history: commits.map(({tag, size}) => `${prettyBytes(size)} (${tag})`).join(' ← ')
    }
  }

  return stat;
}

const generateBody = async ({files, template = './templates/pr.hbs'} = {}) => {
  const data = {
    files: await generateFileReport(files)
  };

  Handlebars.registerHelper('filesize', (bytes)=> prettyBytes(bytes));

  return Handlebars.compile(String(await fs.readFile(template)))(data);
}

console.log(await generateBody({
  files: {
    'Browser build (UMD)' : './dist/axios.min.js',
    'Browser build (ESM)' : './dist/esm/axios.min.js',
  }
}));

