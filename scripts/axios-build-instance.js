import axios from '../index.js';

const { GITHUB_TOKEN } = process.env;

if (GITHUB_TOKEN) {
  console.log(`[GITHUB_TOKEN OK]`);
} else { 
  console.warn(`[GITHUB_TOKEN is not defined]`);
}

const defaultTransform = axios.defaults.transformRequest;

export default axios.create({
  transformRequest: [
    defaultTransform[0],
    function (data) {
      console.log(
        `[${this.method.toUpperCase()}] Request [${new URL(axios.getUri(this)).pathname}]`
      );

      return data;
    },
  ],
  baseURL: 'https://api.github.com/',
  headers: {
    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
  },
});
