'use strict';

module.exports = function isValidXss(requestURL) {
  var xssEventRegex = /(\b)on(click|error|load|mouse\w+|key\w+|focus\w?|blur|change|input|drag\w?|touch\w+|resize|dbclick|contextmenu|drop|select|message|scroll)=/gi;
  var xssJSRegex = /javascript:|(<\s*)(\/*)script/gi;
  return xssJSRegex.test(requestURL) || xssEventRegex.test(requestURL);
};

