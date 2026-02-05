import Handlebars from "handlebars";
import fs from "fs/promises";
import prettyBytes from 'pretty-bytes';
import {getBlobHistory} from './repo.js';
import pacote from "pacote";
import zlib from "zlib";
import tar from "tar-stream";
import { Readable } from "stream";

const FILE_SIZE_DIFF_THRESHOLD = 512; // 0.5KB

const readJSONFile = async (file) => JSON.parse(String(await fs.readFile(file)));

const {version} = await readJSONFile('./package.json');

const parseVersion = (tag) => {
  const [, major, minor, patch] = /^v?(\d+)\.(\d+)\.(\d+)/.exec(tag) || [];
  return [major, minor, patch];
}

const [MAJOR_NUMBER] = parseVersion(version);

async function getFilesFromNPM(pkg) {
  const tgzData = await pacote.tarball(pkg); // Buffer з npm
  const files = {};

  return new Promise((resolve, reject) => {
    const extract = tar.extract();

    extract.on("entry", (header, stream, next) => {
      const buffers = [];

      stream.on('data', (buffer) => {
        buffers.push(buffer);
      });

      stream.on("end", () => {
        const content = Buffer.concat(buffers);

        const gzipped = zlib.gzipSync(content);

        files[header.name.replace(/^package\//, '')] = {
          gzip: gzipped.length,
          compressed: header.size ? gzipped.length / header.size : 1,
          ...header
        };

        next();
      });
    });

    Readable.from(tgzData)
      .pipe(zlib.createGunzip())
      .pipe(extract)
      .on("error", reject)
      .on('finish', () => resolve(files));
  });
}




const generateFileReport = async (files, historyCount = 3) => {
  const allFilesStat = {};
  const commits = (await getBlobHistory('package.json', historyCount)).filter(({tag}) => {
    return MAJOR_NUMBER === parseVersion(tag)[0];
  });
  const warns = [];

  const npmHistory = {};

  await Promise.all(commits.map(async ({tag}) => {
    npmHistory[tag] = await getFilesFromNPM(`axios@${tag.replace(/^v/, '')}`);
  }));

  for(const [name, filename] of Object.entries(files)) {
    const file = await fs.stat(filename).catch(console.warn);
    const gzip = file ? zlib.gzipSync(await fs.readFile(filename)).length : 0;

    const stat = allFilesStat[filename] = file ? {
      name,
      size: file.size,
      path: filename,
      gzip,
      compressed: file.size ? gzip / file.size : 1,
      history: commits.map(({tag}) => {
        const files = npmHistory[tag];
        const file = files && files[filename] || null;

        return {
          tag,
          ...file
        };
      })
    } : null;



    if(stat.history[0]) {
      const diff = stat.gzip - stat.history[0].gzip;

      if (diff > FILE_SIZE_DIFF_THRESHOLD) {
        warns.push({
          filename,
          sizeReport: true,
          diff,
          percent: stat.gzip ? diff / stat.gzip : 0,
        });
      }
    }
  }

  return {
    version,
    files: allFilesStat,
    warns
  };
}

const generateBody = async ({files, template = './templates/pr.hbs'} = {}) => {
  const data = await generateFileReport(files);

  Handlebars.registerHelper('filesize', (bytes) => bytes != null ? prettyBytes(bytes) : '<unknown>');
  Handlebars.registerHelper('percent', (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : `---` );

  return Handlebars.compile(String(await fs.readFile(template)))(data);
}

console.log(await generateBody({
  files: {
    'Browser build (UMD)' : 'dist/axios.min.js',
    'Browser build (ESM)' : 'dist/esm/axios.min.js',
  }
}));
