import fs from 'fs/promises';
import path from 'path';
import {renderContributorsList} from './contributors.js';
import asyncReplace from 'string-replace-async';
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const injectContributors = async (infile, injector) => {
  console.log(`Checking contributors sections in ${infile}`);

  infile = path.resolve(__dirname, infile);

  const content = String(await fs.readFile(infile));
  const headerRE = /^#+\s+\[([-_\d.\w]+)].+?$/mig;
  const contributorsRE = /^\s*### Contributors/mi;

  let tag;
  let index = 0;

  const newContent = await asyncReplace(content, headerRE, async (match, nextTag, offset) => {
    const releaseContent = content.slice(index, offset);

    const hasContributorsSection = contributorsRE.test(releaseContent);

    const currentTag = tag;

    tag = nextTag;
    index = offset + match.length;

    if(currentTag) {
      if (hasContributorsSection) {
        console.log(`[${currentTag}]: ✓ OK`);
      } else {
        console.log(`[${currentTag}]: ❌ MISSED`);
        console.log(`Generating contributors list...`);

        const section = await injector(currentTag);

        console.log(`\nRENDERED CONTRIBUTORS LIST [${currentTag}]:`);
        console.log('-------------BEGIN--------------\n');
        console.log(section);
        console.log('--------------END---------------\n');

        return section + match;
      }
    }

    return match;
  });

  await fs.writeFile(infile, newContent);
}


await injectContributors(
  '../CHANGELOG.md',
  (tag) => renderContributorsList(tag, true, path.resolve(__dirname, '../templates/contributors.hbs')
  ));
