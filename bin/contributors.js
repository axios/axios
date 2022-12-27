import axios from "../index.js";
import util from "util";
import cp from "child_process";
import Handlebars from "handlebars";
import fs from "fs/promises";

const exec = util.promisify(cp.exec);

const removeExtraLineBreaks = (str) => str.replace(/(?:\r\n|\r|\n){3,}/gm, '\r\n\r\n');

const cleanTemplate = template => template
  .replace(/\n +/g, '\n')
  .replace(/^ +/, '')
  .replace(/\n\n\n+/g, '\n\n')
  .replace(/\n\n$/, '\n');

const getUserInfo = ((userCache) => async (email) => {
  if (userCache[email] !== undefined) {
    return userCache[email];
  }
  try {
    const tag = email.replace(/@users\.noreply\.github\.com/, '');

    const {data: {items: [user]}} = await axios.get(`https://api.github.com/search/users?q=${tag}`);

    return (userCache[email] = user ? {
      ...user,
      avatar_url_sm: user.avatar_url + '&s=16'
    } : null);
  } catch (err) {
    console.warn(err);
    return {};
  }
})({});


const getReleaseInfo = async (version, useGithub) => {
  version = 'v' + version.replace(/^v/, '');

  const releases = JSON.parse((await exec(
    `npx auto-changelog ${
      version ? '--starting-version ' + version + ' --ending-version ' + version: ''
    } --stdout --commit-limit false --template json`)).stdout
  );

  for(const release of releases) {
    const authors = {};

    const commits = [
      ...release.commits,
      ...release.fixes.map(fix => fix.commit),
      ...release.merges.map(fix => fix.commit)
    ].filter(Boolean);

    for(const {author, email, insertions, deletions} of commits) {
      const user = Object.assign({
        email
      }, useGithub ? await getUserInfo(email) : null);

      const entry = authors[email] = (authors[email] || {
        insertions: 0, deletions: 0, ...user
      });

      entry.displayName = entry.name || author || entry.login;

      entry.github = entry.login ? `https://github.com/${encodeURIComponent(entry.login)}` : '';

      entry.insertions += insertions;
      entry.deletions += deletions;
      entry.points = entry.insertions + entry.deletions;
    }

    release.authors = Object.values(authors).sort((a, b) => b.points - a.points);
    release.allCommits = commits;
  }

  return releases;
}

const renderContributorsList = async (version, useGithub = false, template) => {
  const release = (await getReleaseInfo(version, useGithub))[0];

  const compile = Handlebars.compile(String(await fs.readFile(template)))

  const content = compile(release);

  return removeExtraLineBreaks(cleanTemplate(content));
}

export {
  renderContributorsList
}
