'use strict';

module.exports = function isValidXss(requestURL) {
  var xssRegex = /(\b)on(click|error|load|mouse\w+|key\w+|focus\w?|blur|change|input|drag\w?|resize)=|javascript|(<\s*)(\/*)script/gi;
  return xssRegex.test(requestURL);
};

