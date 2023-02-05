import axios from '../index.js';

const {GITHUB_TOKEN} = process.env;

export default axios.create({
  headers: {
    Authorization: GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : null
  }
})
