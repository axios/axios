'use strict';

module.exports = function isValidXss(requestURL) {
  var xssRegex = /(\b)on(click|error|load|mouse\w+|key\w+)=|javascript|(<\s*)(\/*)script/gi;
  return xssRegex.test(requestURL);
};

