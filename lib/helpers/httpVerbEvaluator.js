'use strict';

/**
 * Getter for method defaults depending whether a http body is needed or not.
 *
 * @param {boolean} withHttpBody
 * @returns {Array.<string>}
 */
function getDefaults(withHttpBody) {
  return withHttpBody ? ['post', 'put', 'patch'] : ['delete', 'get', 'head'];
}

/**
 * Evaluator which creates a list of http verbs depending on the custom configuration and whether a http body is necessary
 * or not.
 *
 * @param {Array|null} httpVerbs
 * @param {boolean} withHttpBody
 * @returns {Array.<string>}
 *
 * @author Maximilian Bosch <maximilian.bosch.27@gmail.com>
 */
module.exports = function (httpVerbs, withHttpBody) {
  var defaults = getDefaults(withHttpBody);
  if (!Array.isArray(httpVerbs)) {
    return defaults;
  }

  return defaults.concat(
    httpVerbs.filter(function (verbConfig) {
      var canHttpVerbUsedWithHttpBody = typeof verbConfig.with_body !== 'undefined' && verbConfig.with_body;
      return withHttpBody ? canHttpVerbUsedWithHttpBody : !canHttpVerbUsedWithHttpBody;
    }).map(function (verbConfig) {
      if (typeof verbConfig.name === 'undefined') {
        throw new Error('Every http method config object must contain a "name" parameter!');
      }
      return verbConfig.name;
    })
  );
};
