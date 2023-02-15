import axios from "./githubAPI.js";
import util from "util";
import cp from "child_process";
import Handlebars from "handlebars";
import fs from "fs/promises";
import {colorize} from "./helpers/colorize.js";

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

    console.log(colorize()`fetch github commit info (${sha})`);

    const {data} = await axios.get(`https://api.github.com/repos/axios/axios/commits/${sha}`);

    return commitCache[sha] = {
      ...data.commit.author,
      ...data.author,
      avatar_url_sm: data.author.avatar_url ? data.author.avatar_url + '&s=18' : '',
    };
  } catch (err) {
    return commitCache[sha] = null;
  }
})({});

const getIssueById = ((cache) => async (id) => {
  if(cache[id] !== undefined) {
    return cache[id];
  }

  try {
    const {data} = await axios.get(`https://api.github.com/repos/axios/axios/issues/${id}`);

    return cache[id] = data;
  } catch (err) {
    return null;
  }
})({});

const getUserInfo = ((userCache) => async (userEntry) => {
  const {email, commits} = userEntry;

  if (userCache[email] !== undefined) {
    return userCache[email];
  }

  console.log(colorize()`fetch github user info [${userEntry.name}]`);

  return userCache[email] = {
    ...userEntry,
    ...await getUserFromCommit(commits[0].hash)
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

const getReleaseInfo = ((releaseCache) => async (tag) => {
  if(releaseCache[tag] !== undefined) {
    return releaseCache[tag];
  }

  const isUnreleasedTag = !tag;

  const version = 'v' + tag.replace(/^v/, '');

  const command = isUnreleasedTag ?
    `npx auto-changelog --unreleased-only --stdout --commit-limit false --template json` :
    `npx auto-changelog ${
      version ? '--starting-version ' + version + ' --ending-version ' + version : ''
    } --stdout --commit-limit false --template json`;

  const release = JSON.parse((await exec(command)).stdout)[0];

  if(release) {
    const authors = {};

    const commits = [
      ...release.commits,
      ...release.fixes.map(fix => fix.commit),
      ...release.merges.map(fix => fix.commit)
    ].filter(Boolean);

    const commitMergeMap = {};

    for(const merge of release.merges) {
      commitMergeMap[merge.commit.hash] = merge.id;
    }

    for (const {hash, author, email, insertions, deletions} of commits) {
      const entry = authors[email] = (authors[email] || {
        name: author,
        prs: [],
        email,
        commits: [],
        insertions: 0, deletions: 0
      });

      entry.commits.push({hash});

      let pr;

      if((pr = commitMergeMap[hash])) {
        entry.prs.push(pr);
      }

      console.log(colorize()`Found commit [${hash}]`);

      entry.displayName = entry.name || author || entry.login;

      entry.github = entry.login ? `https://github.com/${encodeURIComponent(entry.login)}` : '';

      entry.insertions += insertions;
      entry.deletions += deletions;
      entry.points = entry.insertions + entry.deletions;
    }

    for (const [email, author] of Object.entries(authors)) {
      const entry = authors[email] = await getUserInfo(author);

      entry.isBot = entry.type === "Bot";
    }

    release.authors = Object.values(deduplicate(authors))
      .sort((a, b) => b.points - a.points);

    release.allCommits = commits;
  }

  releaseCache[tag] = release;

  return release;
})({});

const renderContributorsList = async (tag, template) => {
  const release = await getReleaseInfo(tag);

  const compile = Handlebars.compile(String(await fs.readFile(template)))

  const content = compile(release);

  return removeExtraLineBreaks(cleanTemplate(content));
}

const renderPRsList = async (tag, template, {comments_threshold= 5, awesome_threshold= 5, label = 'add_to_changelog'} = {}) => {
  const release = await getReleaseInfo(tag);

  const prs = {};

  for(const merge of release.merges) {
    const pr = await getIssueById(merge.id);

    if (pr && pr.labels.find(({name})=> name === label)) {
      const {reactions, body} = pr;
      prs[pr.number] = pr;
      pr.isHot = pr.comments > comments_threshold;
      const points = reactions['+1'] +
        reactions['hooray'] + reactions['rocket'] + reactions['heart'] + reactions['laugh'] - reactions['-1'];

      pr.isAwesome = points > awesome_threshold;

      let match;

      pr.messages = [];

      if (body && (match = /```+changelog(.+)?```/gms.exec(body)) && match[1]) {
        pr.messages.push(match[1]);
      }
    }
  }

  release.prs = Object.values(prs);

  const compile = Handlebars.compile(String(await fs.readFile(template)))

  const content = compile(release);

  return removeExtraLineBreaks(cleanTemplate(content));
}

const getTagRef = async (tag) => {
  try {
    return (await exec(`git show-ref --tags "refs/tags/${tag}"`)).stdout.split(' ')[0];
  } catch(e) {
  }
}

export {
  renderContributorsList,
  renderPRsList,
  getTagRef
}
