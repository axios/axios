const defaults = require('./test/default.karma.conf');
const devicelist = require('./test/device-list.json');
const package = require('./package.json');
const webpack = require('webpack');

let defaultsLauncherOptions = {
  base: 'BrowserStack',
  build: package.version + '-single-run',
  project: package.name,
  'browserstack.console': 'info',
  'browserstack.debug': 'true',
  'browserstack.local': 'false',
  'browserstack.networkLogs': 'info',
  'browserstack.video' : 'false',
};

// Load the custom launchers from the JSON file.
// 
// The JSON objects are standard BrowserStack capabilities lists, with the
// addition of a `sanity` field. The Sanity check is a profile of devices
// and systems intended to capture only the unique browser vendors/versions.
// A full test run captures the devices and browsers encountered by enterprise
// businesses in North America, Europe, India, China, Japan, Brazil, South 
// Africa, Nigeria, and Russia.
// 
// Capability calculator available at:
// https://www.browserstack.com/automate/capabilities

let customLaunchers = {};
Object.keys(devicelist).forEach((device) => {
  if (process.env.NODE_ENV === 'sanity') {
    if (devicelist[device].sanity === '1') { 
      customLaunchers[device] = {
        ...defaultsLauncherOptions,
        ...devicelist[device],
      };
    }
  } else {
    customLaunchers[device] = {
      ...defaultsLauncherOptions,
      ...devicelist[device],
    };
  }
});

module.exports = function (config, username = process.env.BROWSERSTACK_USERNAME, accessKey = process.env.BROWSERSTACK_ACCESS_KEY) {
  config.set({
    ...defaults,
    browserStack: { username, accessKey },
    browsers: Object.keys(customLaunchers),
    customLaunchers,
    reporters: ['progress', 'BrowserStack'],
    singleRun: true,

    // Timeouts and Concurrency Settings
    concurrency: 5,
    captureTimeout: 60 * 1000,
    browserNoActivityTimeout: 60 * 1000,
  });
}