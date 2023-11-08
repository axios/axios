import axios from '../index.js';

const {GITHUB_TOKEN} = process.env;

GITHUB_TOKEN ? console.log(`[GITHUB_TOKEN OK]`) : console.warn(`[GITHUB_TOKEN is not defined]`);

export default axios.create({
  headers: {
    Authorization: GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : null
  }
})
