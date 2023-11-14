import util from "util";
import cp from "child_process";
import {parseVersion} from "./helpers/parser.js";
import githubAxios from "./githubAxios.js";
import memoize from 'memoizee';

const exec = util.promisify(cp.exec);

export default class GithubAPI {
  constructor(owner, repo) {
    if (!owner) {
      throw new Error('repo owner must be specified');
    }

    if (!repo) {
      throw new Error('repo must be specified');
    }

    this.repo = repo;
    this.owner = owner;
    this.axios = githubAxios.create({
      baseURL: `https://api.github.com/repos/${this.owner}/${this.repo}/`,
    })
  }

  async createComment(issue, body) {
    return (await this.axios.post(`/issues/${issue}/comments`, {body})).data;
  }

  async getComments(issue, {desc = false, per_page= 100, page = 1} = {}) {
    return (await this.axios.get(`/issues/${issue}/comments`, {params: {direction: desc ? 'desc' : 'asc', per_page, page}})).data;
  }

  async getComment(id) {
    return (await this.axios.get(`/issues/comments/${id}`)).data;
  }

  async updateComment(id, body) {
    return (await this.axios.patch(`/issues/comments/${id}`, {body})).data;
  }

  async appendLabels(issue, labels) {
    return (await this.axios.post(`/issues/${issue}/labels`, {labels})).data;
  }

  async getUser(user) {
    return (await githubAxios.get(`/users/${user}`)).data;
  }

  async isCollaborator(user) {
    try {
      return (await this.axios.get(`/collaborators/${user}`)).status === 204;
    } catch (e) {

    }
  }

  async deleteLabel(issue, label) {
    return (await this.axios.delete(`/issues/${issue}/labels/${label}`)).data;
  }

  async getIssue(issue) {
    return (await this.axios.get(`/issues/${issue}`)).data;
  }

  async getPR(issue) {
    return (await this.axios.get(`/pulls/${issue}`)).data;
  }

  async getIssues({state= 'open', labels, sort = 'created', desc = false, per_page = 100, page = 1}) {
    return (await this.axios.get(`/issues`, {params: {state, labels, sort, direction: desc ? 'desc' : 'asc', per_page, page}})).data;
  }

  async updateIssue(issue, data) {
    return (await this.axios.patch(`/issues/${issue}`, data)).data;
  }

  async closeIssue(issue) {
    return this.updateIssue(issue, {
      state: "closed"
    })
  }

  async getReleases({per_page = 30, page= 1} = {}) {
    return (await this.axios.get(`/releases`, {params: {per_page, page}})).data;
  }

  async getRelease(release = 'latest') {
    return (await this.axios.get(parseVersion(release) ? `/releases/tags/${release}` : `/releases/${release}`)).data;
  }

  async getTags({per_page = 30, page= 1} = {}) {
    return (await this.axios.get(`/tags`, {params: {per_page, page}})).data;
  }

  async reopenIssue(issue) {
    return this.updateIssue(issue, {
      state: "open"
    })
  }

  static async getTagRef(tag) {
    try {
      return (await exec(`git show-ref --tags "refs/tags/${tag}"`)).stdout.split(' ')[0];
    } catch (e) {
    }
  }

  static async getLatestTag() {
    try{
      const {stdout} = await exec(`git for-each-ref refs/tags --sort=-taggerdate --format='%(refname)' --count=1`);

      return stdout.split('/').pop();
    } catch (e) {}
  }

  static normalizeTag(tag){
    return tag ? 'v' + tag.replace(/^v/, '') : '';
  }
}

const {prototype} = GithubAPI;

['getUser', 'isCollaborator'].forEach(methodName => {
  prototype[methodName] = memoize(prototype[methodName], { promise: true })
});

['get', 'post', 'put', 'delete', 'isAxiosError'].forEach((method) => prototype[method] = function(...args){
  return this.axios[method](...args);
});

