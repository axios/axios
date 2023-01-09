import fs from 'fs/promises';
import path from 'path';
import {renderContributorsList, getTagRef, renderPRsList} from './contributors.js';
import asyncReplace from 'string-replace-async';
import {fileURLToPath} from "url";
import {colorize} from "./helpers/colorize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONTRIBUTORS_TEMPLATE = path.resolve(__dirname, '../templates/contributors.hbs');
const PRS_TEMPLATE = path.resolve(__dirname, '../templates/prs.hbs');

const injectSection = async (name, contributorsRE, injector, infile = '../CHANGELOG.md') => {
  console.log(colorize()`Checking ${name} sections in ${infile}`);

  infile = path.resolve(__dirname, infile);

  const content = String(await fs.readFile(infile));
  const headerRE = /^#+\s+\[([-_\d.\w]+)].+?$/mig;

  let tag;
  let index = 0;
  let isFirstTag = true;

  const newContent = await asyncReplace(content, headerRE, async (match, nextTag, offset) => {
    const releaseContent = content.slice(index, offset);

    const hasSection = contributorsRE.test(releaseContent);

    const currentTag = tag;

    tag = nextTag;
    index = offset + match.length;

    if(currentTag) {
      if (hasSection) {
        console.log(colorize()`[${currentTag}]: ✓ OK`);
      } else {
        const target = isFirstTag && (!await getTagRef(currentTag)) ? '' : currentTag;

        console.log(colorize()`[${currentTag}]: ❌ MISSED` + (!target ? ' (UNRELEASED)' : ''));

        isFirstTag = false;

        console.log(`Generating section...`);

        const section = await injector(target);

        if (!section) {
          return match;
        }

        console.log(colorize()`\nRENDERED SECTION [${name}] for [${currentTag}]:`);
        console.log('-------------BEGIN--------------\n');
        console.log(section);
        console.log('--------------END---------------\n');

        return section + '\n' + match;
      }
    }

    return match;
  });

  await fs.writeFile(infile, newContent);
}

await injectSection(
  'PRs',
  /^\s*### PRs/mi,
  (tag) => tag ? '' : renderPRsList(tag, PRS_TEMPLATE, {awesome_threshold: 5, comments_threshold: 7}),
);

await injectSection(
  'contributors',
  /^\s*### Contributors/mi,
  (tag) => renderContributorsList(tag, CONTRIBUTORS_TEMPLATE)
);
