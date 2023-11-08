import GithubAPI from "./GithubAPI.js";
import api from './api.js';
import Handlebars from "handlebars";
import fs from "fs/promises";
import {colorize} from "./helpers/colorize.js";
import {getReleaseInfo} from "./contributors.js";

const normalizeTag = (tag) => tag.replace(/^v/, '');

class RepoBot {
  constructor(options) {
    const {
      owner, repo,
      templates
    } = options || {};

    this.templates = Object.assign({
      published: '../templates/pr_published.hbs'
    }, templates);

    this.github = api || new GithubAPI(owner, repo);

    this.owner = this.github.owner;
    this.repo = this.github.repo;
  }

  async addComment(targetId, message) {
    return this.github.createComment(targetId, message);
  }

  async notifyPRPublished(id, tag) {
    const pr = await this.github.getPR(id);

    tag = normalizeTag(tag);

    const {merged, labels, user: {login, type}} = pr;

    const isBot = type === 'Bot';

    if (!merged) {
      return false
    }

    await this.github.appendLabels(id, ['v' + tag]);

    if (isBot || labels.find(({name}) => name === 'automated pr') || (await this.github.isCollaborator(login))) {
      return false;
    }

    const author = await this.github.getUser(login);

    author.isBot = isBot;

    const message = await this.constructor.renderTemplate(this.templates.published, {
      id,
      author,
      release: {
        tag,
        url: `https://github.com/${this.owner}/${this.repo}/releases/tag/v${tag}`
      }
    });

    return await this.addComment(id, message);
  }

  async notifyPublishedPRs(tag) {
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
        console.log(result ? 'OK' : 'Skipped');
      } catch (err) {
        console.warn(colorize('green', 'red')`  Failed notify PR ${pr.id}: ${err.message}`);
      }
    }
  }

  static async renderTemplate(template, data) {
    return Handlebars.compile(String(await fs.readFile(template)))(data);
  }
}

export default RepoBot;
