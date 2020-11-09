const defaults = require('./test/default.karma.conf');
const os = require('os');

let bs = {
  username: process.env.BROWSERSTACK_USERNAME,
  accessKey: process.env.BROWSERSTACK_ACCESS_KEY
}

let sauce = {
  username: process.env.SAUCE_USERNAME,
  accessKey: process.env.SAUCE_ACCESS_KEY,
};

let travis = {
  pr: process.env.TRAVIS_PULL_REQUEST
}

module.exports = function (config) {
  if (bs.username && bs.accessKey) {

    // running tests on BrowserStack:
    return require('./karma-browserstack.conf')(config, bs.username, bs.accessKey);

  } else if (sauce.username || sauce.accessKey) {

    // SauceLabs:
    return require('./karma-saucelabs.conf')(config);
    
  } else if (travis.pr && travis.pr !== 'false') {
    
    // Running a Pull Request in TravisCI. Use the SauceLabs Config, for now:
    return require('./karma-saucelabs.conf')(config);
    
  }

  // Running Locally, Turn on browsers based on OS:
  // You can overwrite this with the `--browsers` switch:
  // Example: `karma start --browsers Chrome,IE,Opera`
  let browsers = [];

  switch (os.platform) {
    case 'darwin':
      browsers = ['Safari'];
      break;
    case 'win32':
      browsers = ['Edge'];
      break;
    default:
      // Firefox is a safe bet on Debian/Arch/Others
      browsers = ['Firefox'];
      break;
  }

  config.set({
    ...defaults,
    browsers,
    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/',
      subdir: '.'
    },
  });
}