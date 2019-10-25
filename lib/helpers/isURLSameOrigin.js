'use strict';

var utils = require('./../utils');
var isValidXss = require('./isValidXss');

module.exports = (
  utils.isStandardBrowserEnv() ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      /**
       * Parse a URL to discover it's components
       *
       * @param {String} url The URL to be parsed
       * @param {String} base The base URL
       * @returns {Object}
       */
      function resolveURL(url, base) {
        var msie = /(msie|trident)/i.test(navigator.userAgent);
        // IE (?-11) not support URL api, create an <a> element to resolve the url
        if (msie) {
          var urlParsingNode = document.createElement('a');

          // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', url);
          urlParsingNode.setAttribute('href', urlParsingNode.href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
              urlParsingNode.pathname :
              '/' + urlParsingNode.pathname
          };
        }
        return new URL(url, base);
      }
      /**
       * Determine if a URL shares the same origin as the current location
       *
       * @param {String} requestURL The URL to test
       * @returns {boolean} True if URL shares the same origin, otherwise false
       */
      return function isURLSameOrigin(requestURL) {
        if (isValidXss(requestURL) || isValidXss(window.location.href)) {
          throw new Error('URL contains XSS injection attempt');
        }
        var originURL = window.location;
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL, originURL.href) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);
