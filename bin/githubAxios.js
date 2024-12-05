import axios from '../index.js';
import {colorize} from "./helpers/colorize.js";

const {GITHUB_TOKEN} = process.env;

GITHUB_TOKEN ? console.log(`[GITHUB_TOKEN OK]`) : console.warn(`[GITHUB_TOKEN is not defined]`);

const defaultTransform = axios.defaults.transformRequest;

export default axios.create({
  transformRequest: [defaultTransform[0], function (data) {
    console.log(colorize()`[${this.method.toUpperCase()}] Request [${new URL(axios.getUri(this)).pathname}]`);
    return data;
  }],
  baseURL: 'https://api.github.com/',
  headers: {
    Authorization: GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : null
  }
});
