import {exec, getTags} from "./repo.js";
import fs from "fs";
import {colorize} from "./helpers/colorize.js";

const {version} = JSON.parse(fs.readFileSync('./package.json'));

const [major] = version.split('.');
const tags = await getTags();
const latestTag = (tags[0] || '').replace(/^v/, '');

const isBeta = !/^v?(\d+).(\d)+.(\d)+$/.test(version);
const isLatest = latestTag === version;

let tag = isBeta ? 'next' : isLatest ? 'latest' : `v${major}`;

console.log(colorize()`Version [${version}] [${isBeta ? 'prerelease' : 'release'}] latest [${latestTag}]=> NPM Tag [${tag}]`);

await exec(`echo "tag=${tag}" >> $GITHUB_OUTPUT`);
