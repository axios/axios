import util from "util";
import cp from "child_process";
import Handlebars from "handlebars";
import fs from "fs/promises";
import prettyBytes from 'pretty-bytes';
import {gzipSize} from 'gzip-size';

const exec = util.promisify(cp.exec);

const getBlobHistory = async (filepath, maxCount= 5) => {
  const log = (await exec(
    `git log --max-count=${maxCount} --no-walk --tags=v* --oneline --format=%H%d -- ${filepath}`
  )).stdout;

  const commits = [];

  let match;

  const regexp = /^(\w+) \(tag: (v?[.\d]+)\)$/gm;

  while((match = regexp.exec(log))) {
    commits.push({
      sha: match[1],
      tag: match[2],
      size: await getBlobSize(filepath, match[1])
    })
  }

  return commits;
}

const getBlobSize = async (filepath, sha ='HEAD') => {
  const size = (await exec(
    `git cat-file -s ${sha}:${filepath}`
  )).stdout;

  return size ? +size : 0;
}

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

