import GithubAPI from "./GithubAPI.js";
import api from './api.js';
import Handlebars from "handlebars";
import fs from "fs/promises";
import {colorize} from "./helpers/colorize.js";
import {getReleaseInfo} from "./contributors.js";
import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NOTIFY_PR_TEMPLATE = path.resolve(__dirname, '../templates/pr_published.hbs');

const normalizeTag = (tag) => tag ? 'v' + tag.replace(/^v/, '') : '';

const GITHUB_BOT_LOGIN = 'github-actions[bot]';

const skipCollaboratorPRs = true;

class RepoBot {
  constructor(options) {
    const {
      owner, repo,
      templates
    } = options || {};

    this.templates = Object.assign({
      published: NOTIFY_PR_TEMPLATE
    }, templates);

    this.github = api || new GithubAPI(owner, repo);

    this.owner = this.github.owner;
    this.repo = this.github.repo;
  }

  async addComment(targetId, message) {
    return this.github.createComment(targetId, message);
  }

  async notifyPRPublished(id, tag) {
    let pr;

    try {
      pr = await this.github.getPR(id);
    } catch (err) {
      if(err.response?.status === 404) {
        throw new Error(`PR #${id} not found (404)`);
      }

      throw err;
    }

    tag = normalizeTag(tag);

    const {merged, labels, user: {login, type}} = pr;

    const isBot = type === 'Bot';

    if (!merged) {
      return false
    }

    await this.github.appendLabels(id, [tag]);

    if (isBot || labels.find(({name}) => name === 'automated pr') || (skipCollaboratorPRs && await this.github.isCollaborator(login))) {
      return false;
    }

    const comments = await this.github.getComments(id, {desc: true});

    const comment = comments.find(
      ({body, user}) => user.login === GITHUB_BOT_LOGIN && body.indexOf('published in') >= 0
    )

    if (comment) {
      console.log(colorize()`Release comment [${comment.html_url}] already exists in #${pr.id}`);
      return false;
    }

    const author = await this.github.getUser(login);

    author.isBot = isBot;

    const message = await this.constructor.renderTemplate(this.templates.published, {
      id,
      author,
      release: {
        tag,
        url: `https://github.com/${this.owner}/${this.repo}/releases/tag/${tag}`
      }
    });

    return await this.addComment(id, message);
  }

  async notifyPublishedPRs(tag) {
    tag = normalizeTag(tag);

    const release = await getReleaseInfo(tag);

    if (!release) {
      throw Error(colorize()`Can't get release info for ${tag}`);
    }

    const {merges} = release;

    console.log(colorize()`Found ${merges.length} PRs in ${tag}:`);

    let i = 0;

    for (const pr of merges) {
      try {
        console.log(colorize()`${i++}) Notify PR #${pr.id}`)
        const result = await this.notifyPRPublished(pr.id, tag);
        console.log('✔️', result ? 'Label, comment' : 'Label');
      } catch (err) {
        console.warn(colorize('green', 'red')`❌ Failed notify PR ${pr.id}: ${err.message}`);
      }
    }
  }

  static async renderTemplate(template, data) {
    return Handlebars.compile(String(await fs.readFile(template)))(data);
  }
}

export default RepoBot;
