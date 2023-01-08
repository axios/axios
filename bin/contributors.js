import axios from "./githubAPI.js";
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

const getUserFromCommit = ((commitCache) => async (sha) => {
  try {
    if(commitCache[sha] !== undefined) {
      return commitCache[sha];
    }

    const {data} = await axios.get(`https://api.github.com/repos/axios/axios/commits/${sha}`);

    return commitCache[sha] = {
      ...data.commit.author,
      ...data.author,
      avatar_url_sm: data.author.avatar_url ? data.author.avatar_url + '&s=16' : '',
    };
  } catch (err) {
    return commitCache[sha] = null;
  }
})({});

const getUserInfo = ((userCache) => async (userEntry) => {
  const {email, commits} = userEntry;

  if (userCache[email] !== undefined) {
    return userCache[email];
  }

  console.log(`fetch github user info [${userEntry.name}]`);

  return userCache[email] = {
    ...userEntry,
    ...await getUserFromCommit(commits[0])
  }
})({});

const deduplicate = (authors) => {
  const loginsMap = {};
  const combined= {};

  const assign = (a, b) => {
    const {insertions, deletions, points, ...rest} = b;

    Object.assign(a, rest);

    a.insertions += insertions;
    a.deletions += insertions;
    a.insertions += insertions;
  }

  for(const [email, user] of Object.entries(authors)) {
    const {login} = user;
    let entry;

    if(login && (entry = loginsMap[login])) {
       assign(entry, user);
    } else {
      login && (loginsMap[login] = user);
      combined[email] = user;
    }
  }

  return combined;
}

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

    for(const {hash, author, email, insertions, deletions} of commits) {
      const entry = authors[email] = (authors[email] || {
        name: author,
        email,
        commits: [],
        insertions: 0, deletions: 0
      });

      entry.commits.push(hash);

      entry.displayName = entry.name || author || entry.login;

      entry.github = entry.login ? `https://github.com/${encodeURIComponent(entry.login)}` : '';

      entry.insertions += insertions;
      entry.deletions += deletions;
      entry.points = entry.insertions + entry.deletions;
      entry.isBot = entry.type === "Bot"
    }

    for(const [email, author] of Object.entries(authors)) {
      authors[email] = await getUserInfo(author);
    }

    release.authors = Object.values(deduplicate(authors)).sort((a, b) => b.points - a.points);
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
