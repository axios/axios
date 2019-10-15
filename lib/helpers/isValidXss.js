'use strict';

module.exports = function isValidXss(requestURL) {
  var xssRegex = /(\b)(on\S+)(\s*)=|javascript|(<\s*)(\/*)script/gi;
  return xssRegex.test(requestURL);
};
