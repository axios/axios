'use strict';

var url = require('url');

function parseUrl(config) {
  var auth = undefined;
  if (config.auth) {
    var username = config.auth.username || '';
    var password = config.auth.password || '';
    auth = username + ':' + password;
  }

  // Parse url
  var parsed = url.parse(config.url);
  var protocol = parsed.protocol || 'http:';

  if (!auth && parsed.auth) {
    var urlAuth = parsed.auth.split(':');
    var urlUsername = urlAuth[0] || '';
    var urlPassword = urlAuth[1] || '';
    auth = urlUsername + ':' + urlPassword;
  }
  return { protocol: protocol, auth: auth };
}

module.exports = parseUrl;
