module.exports = {
  "env": {
    "browser": true,
    "es2018": true,
    "node": true,
    "mocha": true,
    "jasmine": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "globals": {
    "axios": "readonly",
    "getAjaxRequest": "readonly"
  },
  "rules": {
    "no-cond-assign": 0
  }
}
