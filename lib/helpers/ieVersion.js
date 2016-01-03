'use strict';

/**
 * https://gist.github.com/padolsey/527683
 *
 * A short snippet for detecting versions of IE in JavaScript
 * without resorting to user-agent sniffing
 *
 * @returns {Number|undefined} Number of IE version (5-9), otherwise undefined
 */
module.exports = function ieVersion() {
  var undef;
  var v = 3;
  var div = document.createElement('div');
  var all = div.getElementsByTagName('i');

  while ((
    div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
    all[0]
  ));

  return v > 4 ? v : undef;
};
