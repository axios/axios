'use strict';

module.exports = function isValidXss(requestURL) {
  const regex = RegExp('<script+.*>+.*<\/script>');
  return regex.test(requestURL);
};
