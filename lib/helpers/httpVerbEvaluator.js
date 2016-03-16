'use strict';

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
module.exports = function httpVerbEvaluator(httpVerbs, withHttpBody) {
  if (!Array.isArray(httpVerbs)) {
    return [];
  }

  return httpVerbs.filter(
    function filter(verbConfig) {
      var canHttpVerbUsedWithHttpBody = typeof verbConfig.with_body !== 'undefined' && verbConfig.with_body;
      return withHttpBody ? canHttpVerbUsedWithHttpBody : !canHttpVerbUsedWithHttpBody;
    }
  ).map(
    function map(verbConfig) {
      if (typeof verbConfig.name === 'undefined') {
        throw new Error('Every http method config object must contain a "name" parameter!');
      }
      return verbConfig.name.toLowerCase();
    }
  );
};
