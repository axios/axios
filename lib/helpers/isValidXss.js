'use strict';

module.exports = function isValidXss(requestURL) {
  var regex = RegExp('<script+.*>+.*<\/script>');
  return regex.test(requestURL);
};
